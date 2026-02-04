import JSZip from "jszip";
import { AppError } from "./AppError";
import { logger } from "../config/logger";
import * as fs from "fs/promises";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

interface TextNode {
  id: string;
  text: string;
  xmlPath: string[]
}

interface DocxContent {
  zip: JSZip;
  documentXML: any;
  headerXMLs: Map<string, any>;
  footerXMLs: Map<string, any>;
  textNodes: TextNode[]
}

const xmlOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  format: true,
  preserveOrder: false,
};


export const loadDocx = async (filePath: string) => {
  try {
    const data = await fs.readFile(filePath)
    const zip = await JSZip.loadAsync(data)

    const parser = new XMLParser(xmlOptions)

    const documentXMLString = await zip.file("word/document.xml")?.async("text")
    if (!documentXMLString) {
      logger.error(`Invalid DOCX: word/document.xml not found: ${documentXMLString}`)
      throw new AppError("Invalid DOCX: word/document.xml not found", 500);
    }
    const documentXML = parser.parse(documentXMLString)


    const headerXMLs = new Map<string, string>()
    const headerFiles = Object.keys(zip.files).filter((name) => name.startsWith("word/header") && name.endsWith(".xml"))

    for (const headerFile of headerFiles) {
      const headerXMLString = await zip.file(headerFile)?.async("text")
      if (headerXMLString) {
        headerXMLs.set(headerFile, parser.parse(headerXMLString))
      }
    }

    const footerXMLs = new Map<string, any>();
    const footerFiles = Object.keys(zip.files).filter((name) =>
      name.startsWith("word/footer") && name.endsWith(".xml")
    );
    for (const footerFile of footerFiles) {
      const footerXmlString = await zip.file(footerFile)?.async("text");
      if (footerXmlString) {
        footerXMLs.set(footerFile, parser.parse(footerXmlString));
      }
    }

    const textNodes = extractTextNodes(documentXML, headerXMLs, footerXMLs);

    logger.info(`Loaded DOCX with ${textNodes.length} text nodes`);

    return {
      zip,
      documentXML,
      headerXMLs,
      footerXMLs,
      textNodes,
    };

  } catch (error) {
    logger.error(`Failed to load DOCX: ${error instanceof Error ? error.message : String(error)}`);
    throw new AppError(`Failed to load DOCX from ${filePath}`, 500);
  }
}

const extractTextFromNode = (node: any,
  path: string[],
  textNodes: TextNode[],
  index: { value: number }): void => {
  if (!node || typeof node !== "object") {
    return
  }

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

  for (const key in node) {
    if (key === "@_" || key === "#text") continue;
    const child = node[key]

    if (Array.isArray(child)) {
      child.forEach((item, idx) => {
        extractTextFromNode(item, [...path, `${key}[${idx}]`], textNodes, index)
      })
    } else if (typeof child === "object") {
      extractTextFromNode(child, [...path, key], textNodes, index);
    }
  }
}

export const extractTextNodes = (
  documentXML: any,
  headerXMLs: Map<string, any>,
  footerXMLs: Map<string, any>
): TextNode[] => {
  const textNodes: TextNode[] = []
  const globalIndex = { value: 0 }


  const body = documentXML?.["w:document"]?.["w.body"]
  if (body) {
    extractTextFromNode(body, ["document", "body"], textNodes, globalIndex);
  }

  for (const [fileName, headerXML] of headerXMLs.entries()) {
    const header = headerXML?.["w:hdr"]
    if (header) {
      extractTextFromNode(header, ["header", fileName], textNodes, globalIndex);
    }
  }

  for (const [fileName, footerXml] of footerXMLs.entries()) {
    const footer = footerXml?.["w:ftr"];
    if (footer) {
      extractTextFromNode(footer, ["footer", fileName], textNodes, globalIndex);
    }
  }

  return textNodes
}

export const replaceTextInDocx = (
  docxContent: DocxContent,
  translations: Map<string, string>
) => {
  try {
    replaceTextInNode(docxContent.documentXML, translations, docxContent.textNodes)

    for (const [fileName, headerXML] of docxContent.headerXMLs.entries()) {
      replaceTextInNode(headerXML, translations, docxContent.textNodes)
    }

    for (const [fileName, footerXml] of docxContent.footerXMLs.entries()) {
      replaceTextInNode(footerXml, translations, docxContent.textNodes);
    }

    logger.info(`Replaced ${translations.size} text nodes with translations`);
    return docxContent;
  } catch (error) {
    logger.error(`Failed to replace text: ${error instanceof Error ? error.message : String(error)}`);
    throw new AppError("Failed to replace text in DOCX", 500);
  }
}


const replaceTextInNode = async (node: any,
  translations: Map<string, string>,
  textNodes: TextNode[]) => {
  if (!node || typeof node !== "object") return;

  if (node["w:t"]) {
    const textContent = node["w:t"]
    const matchingNode = textNodes.find((tn) => {
      if (typeof textContent === "string") {
        return tn.text === textContent
      } else if (typeof textContent === "object" && textContent["#text"]) {
        return tn.text === textContent["#text"];
      }
      return false
    })

    if (matchingNode && translations.has(matchingNode.id)) {
      const translatedText = translations.get(matchingNode.id)
      if (typeof textContent === "string") {
        node["w:t"] = translatedText;
      } else if (typeof textContent === "object" && textContent["#text"]) {
        node["w:t"]["#text"] = translatedText;
      }
    }
  }

  for (const key in node) {
    if (key === "@_" || key === "#text") continue;
    const child = node[key]
    if (Array.isArray(child)) {
      child.forEach((item) => replaceTextInNode(item, translations, textNodes));
    } else if (typeof child === "object") {
      replaceTextInNode(child, translations, textNodes);
    }
  }
}

export const saveDocx = async (docxContent: DocxContent,
  outputPath: string): Promise<void> => {
  try {
    const builder = new XMLBuilder(xmlOptions)

    const documentXmlString = builder.build(docxContent.documentXML)
    docxContent.zip.file("word/document.xml", documentXmlString);

    for (const [fileName, headerXML] of docxContent.headerXMLs.entries()) {
      const headerXMLString = builder.build(headerXML)
      docxContent.zip.file(fileName, headerXMLString)
    }
    for (const [fileName, footerXml] of docxContent.footerXMLs.entries()) {
      const footerXmlString = builder.build(footerXml);
      docxContent.zip.file(fileName, footerXmlString);
    }

    const content = await docxContent.zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE"
    })
    await fs.writeFile(outputPath, content)
    logger.info(`Saved translated DOCX to ${outputPath}`);
  } catch (error) {
    logger.error(`Failed to save DOCX: ${error instanceof Error ? error.message : String(error)}`);
    throw new AppError(`Failed to save DOCX to ${outputPath}`, 500);
  }
}

export const extractTextForTranslation = async (filePath: string) => {
  const docxContent = await loadDocx(filePath);

  return docxContent.textNodes.map((node) => ({
    id: node.id,
    text: node.text,
    type: "text-run" as const,
  }));
}

export const translateAndSaveDocx = async (inputPath: string,
  outputPath: string,
  translateFn: (text: string) => string | Promise<string>): Promise<void> => {
  try {
    const docxContent = await loadDocx(inputPath)

    const translations = new Map<string, string>()

    for (const node of docxContent.textNodes) {
      const translated = await translateFn(node.text)
      translations.set(node.id, translated)
    }

    const updatedContent = replaceTextInDocx(docxContent, translations)

    await saveDocx(updatedContent, outputPath)

    logger.info(`Translation complete: ${inputPath} → ${outputPath}`);
  } catch (error) {
    logger.error(`Failed to translate DOCX: ${error instanceof Error ? error.message : String(error)}`);
    throw new AppError(`Failed to translate DOCX: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
}