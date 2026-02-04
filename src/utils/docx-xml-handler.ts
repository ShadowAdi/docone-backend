import JSZip from "jszip";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import * as fs from "fs/promises";
import { logger } from "../config/logger";
import { AppError } from "./AppError";

interface TextNode {
  id: string;
  text: string;
  xmlPath: string[]; // Path to locate the node in XML tree
}

interface DocxContent {
  zip: JSZip;
  documentXml: any;
  headerXmls: Map<string, any>;
  footerXmls: Map<string, any>;
  textNodes: TextNode[];
}

const xmlOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  format: true,
  preserveOrder: false,
};

/**
 * Extract DOCX as a ZIP and parse its XML files
 */
export const loadDocx = async (filePath: string): Promise<DocxContent> => {
  try {
    const data = await fs.readFile(filePath);
    const zip = await JSZip.loadAsync(data);

    const parser = new XMLParser(xmlOptions);

    // Parse main document.xml
    const documentXmlString = await zip.file("word/document.xml")?.async("text");
    if (!documentXmlString) {
      throw new AppError("Invalid DOCX: word/document.xml not found", 500);
    }
    const documentXml = parser.parse(documentXmlString);

    // Parse headers (if any)
    const headerXmls = new Map<string, any>();
    const headerFiles = Object.keys(zip.files).filter((name) =>
      name.startsWith("word/header") && name.endsWith(".xml")
    );
    for (const headerFile of headerFiles) {
      const headerXmlString = await zip.file(headerFile)?.async("text");
      if (headerXmlString) {
        headerXmls.set(headerFile, parser.parse(headerXmlString));
      }
    }

    // Parse footers (if any)
    const footerXmls = new Map<string, any>();
    const footerFiles = Object.keys(zip.files).filter((name) =>
      name.startsWith("word/footer") && name.endsWith(".xml")
    );
    for (const footerFile of footerFiles) {
      const footerXmlString = await zip.file(footerFile)?.async("text");
      if (footerXmlString) {
        footerXmls.set(footerFile, parser.parse(footerXmlString));
      }
    }

    // Extract text nodes
    const textNodes = extractTextNodes(documentXml, headerXmls, footerXmls);

    logger.info(`Loaded DOCX with ${textNodes.length} text nodes`);

    return {
      zip,
      documentXml,
      headerXmls,
      footerXmls,
      textNodes,
    };
  } catch (error) {
    logger.error(`Failed to load DOCX: ${error instanceof Error ? error.message : String(error)}`);
    throw new AppError(`Failed to load DOCX from ${filePath}`, 500);
  }
};

/**
 * Recursively extract all <w:t> text nodes from XML structure
 */
const extractTextNodes = (
  documentXml: any,
  headerXmls: Map<string, any>,
  footerXmls: Map<string, any>
): TextNode[] => {
  const textNodes: TextNode[] = [];
  const globalIndex = { value: 0 };

  // Extract from main document
  const body = documentXml?.["w:document"]?.["w:body"];
  if (body) {
    extractTextFromNode(body, ["document", "body"], textNodes, globalIndex);
  }

  // Extract from headers
  for (const [fileName, headerXml] of headerXmls.entries()) {
    const header = headerXml?.["w:hdr"];
    if (header) {
      extractTextFromNode(header, ["header", fileName], textNodes, globalIndex);
    }
  }

  // Extract from footers
  for (const [fileName, footerXml] of footerXmls.entries()) {
    const footer = footerXml?.["w:ftr"];
    if (footer) {
      extractTextFromNode(footer, ["footer", fileName], textNodes, globalIndex);
    }
  }

  return textNodes;
};

/**
 * Recursive function to traverse XML and find <w:t> nodes
 */
const extractTextFromNode = (
  node: any,
  path: string[],
  textNodes: TextNode[],
  index: { value: number }
): void => {
  if (!node || typeof node !== "object") return;

  // Check if this is a text node <w:t>
  if (node["w:t"]) {
    const textContent = node["w:t"];
    if (typeof textContent === "string" && textContent.trim().length > 0) {
      textNodes.push({
        id: `t_${textNodes.length}`,
        text: textContent,
        xmlPath: [...path],
      });
    } else if (typeof textContent === "object" && textContent["#text"]) {
      const text = textContent["#text"];
      if (typeof text === "string" && text.trim().length > 0) {
        textNodes.push({
          id: `t_${textNodes.length}`,
          text: text,
          xmlPath: [...path],
        });
      }
    }
  }

  // Recursively traverse child nodes
  for (const key in node) {
    if (key === "@_" || key === "#text") continue; // Skip attributes and text content
    const child = node[key];
    
    if (Array.isArray(child)) {
      child.forEach((item, idx) => {
        extractTextFromNode(item, [...path, `${key}[${idx}]`], textNodes, index);
      });
    } else if (typeof child === "object") {
      extractTextFromNode(child, [...path, key], textNodes, index);
    }
  }
};

/**
 * Replace text in the XML structure with translations
 */
export const replaceTextInDocx = (
  docxContent: DocxContent,
  translations: Map<string, string>
): DocxContent => {
  try {
    // Replace in main document
    replaceTextInNode(docxContent.documentXml, translations, docxContent.textNodes);

    // Replace in headers
    for (const [fileName, headerXml] of docxContent.headerXmls.entries()) {
      replaceTextInNode(headerXml, translations, docxContent.textNodes);
    }

    // Replace in footers
    for (const [fileName, footerXml] of docxContent.footerXmls.entries()) {
      replaceTextInNode(footerXml, translations, docxContent.textNodes);
    }

    logger.info(`Replaced ${translations.size} text nodes with translations`);
    return docxContent;
  } catch (error) {
    logger.error(`Failed to replace text: ${error instanceof Error ? error.message : String(error)}`);
    throw new AppError("Failed to replace text in DOCX", 500);
  }
};

/**
 * Recursively find and replace text in <w:t> nodes
 */
const replaceTextInNode = (
  node: any,
  translations: Map<string, string>,
  textNodes: TextNode[]
): void => {
  if (!node || typeof node !== "object") return;

  // Check if this is a text node <w:t> and replace it
  if (node["w:t"]) {
    const textContent = node["w:t"];
    
    // Find matching text node from our extracted list
    const matchingNode = textNodes.find((tn) => {
      if (typeof textContent === "string") {
        return tn.text === textContent;
      } else if (typeof textContent === "object" && textContent["#text"]) {
        return tn.text === textContent["#text"];
      }
      return false;
    });

    if (matchingNode && translations.has(matchingNode.id)) {
      const translatedText = translations.get(matchingNode.id)!;
      
      if (typeof textContent === "string") {
        node["w:t"] = translatedText;
      } else if (typeof textContent === "object" && textContent["#text"]) {
        node["w:t"]["#text"] = translatedText;
      }
    }
  }

  // Recursively traverse child nodes
  for (const key in node) {
    if (key === "@_" || key === "#text") continue;
    const child = node[key];
    
    if (Array.isArray(child)) {
      child.forEach((item) => replaceTextInNode(item, translations, textNodes));
    } else if (typeof child === "object") {
      replaceTextInNode(child, translations, textNodes);
    }
  }
};

/**
 * Build and save the modified DOCX file
 */
export const saveDocx = async (
  docxContent: DocxContent,
  outputPath: string
): Promise<void> => {
  try {
    const builder = new XMLBuilder(xmlOptions);

    // Rebuild main document.xml
    const documentXmlString = builder.build(docxContent.documentXml);
    docxContent.zip.file("word/document.xml", documentXmlString);

    // Rebuild headers
    for (const [fileName, headerXml] of docxContent.headerXmls.entries()) {
      const headerXmlString = builder.build(headerXml);
      docxContent.zip.file(fileName, headerXmlString);
    }

    // Rebuild footers
    for (const [fileName, footerXml] of docxContent.footerXmls.entries()) {
      const footerXmlString = builder.build(footerXml);
      docxContent.zip.file(fileName, footerXmlString);
    }

    // Generate new DOCX file
    const content = await docxContent.zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    await fs.writeFile(outputPath, content);
    logger.info(`Saved translated DOCX to ${outputPath}`);
  } catch (error) {
    logger.error(`Failed to save DOCX: ${error instanceof Error ? error.message : String(error)}`);
    throw new AppError(`Failed to save DOCX to ${outputPath}`, 500);
  }
};

/**
 * Complete workflow: extract text nodes for translation
 */
export const extractTextForTranslation = async (filePath: string) => {
  const docxContent = await loadDocx(filePath);
  
  return docxContent.textNodes.map((node) => ({
    id: node.id,
    text: node.text,
    type: "text-run" as const,
  }));
};

/**
 * Complete workflow: translate and save DOCX
 */
export const translateAndSaveDocx = async (
  inputPath: string,
  outputPath: string,
  translateFn: (text: string) => string | Promise<string>
): Promise<void> => {
  try {
    // Load DOCX
    const docxContent = await loadDocx(inputPath);

    // Build translation map
    const translations = new Map<string, string>();
    for (const node of docxContent.textNodes) {
      const translated = await translateFn(node.text);
      translations.set(node.id, translated);
    }

    // Replace text
    const updatedContent = replaceTextInDocx(docxContent, translations);

    // Save new DOCX
    await saveDocx(updatedContent, outputPath);

    logger.info(`Translation complete: ${inputPath} → ${outputPath}`);
  } catch (error) {
    logger.error(`Failed to translate DOCX: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};
