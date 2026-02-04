import JSZip from "jszip";
import { AppError } from "./AppError";
import { logger } from "../config/logger";
import * as fs from "fs/promises";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

interface TextNode {
  id: string;
  text: string;
  xmlPath: string[];
  slideFile: string;
}

interface PptxContent {
  zip: JSZip;
  slideXMLs: Map<string, any>;
  textNodes: TextNode[];
}

const xmlOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  format: true,
  preserveOrder: false,
};

export const loadPptx = async (filePath: string) => {
  try {
    const data = await fs.readFile(filePath);
    const zip = await JSZip.loadAsync(data);

    const parser = new XMLParser(xmlOptions);

    // Get all slide files
    const slideXMLs = new Map<string, any>();
    const slideFiles = Object.keys(zip.files).filter(
      (name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml") && !name.includes("_rels")
    );

    if (slideFiles.length === 0) {
      logger.error(`Invalid PPTX: no slides found`);
      throw new AppError("Invalid PPTX: no slides found", 500);
    }

    for (const slideFile of slideFiles) {
      const slideXMLString = await zip.file(slideFile)?.async("text");
      if (slideXMLString) {
        slideXMLs.set(slideFile, parser.parse(slideXMLString));
      }
    }

    const textNodes = extractTextNodes(slideXMLs);

    logger.info(`Loaded PPTX with ${slideFiles.length} slides and ${textNodes.length} text nodes`);

    return {
      zip,
      slideXMLs,
      textNodes,
    };
  } catch (error) {
    logger.error(`Failed to load PPTX: ${error instanceof Error ? error.message : String(error)}`);
    throw new AppError(`Failed to load PPTX from ${filePath}`, 500);
  }
};

const extractTextFromNode = (
  node: any,
  path: string[],
  textNodes: TextNode[],
  slideFile: string
): void => {
  if (!node || typeof node !== "object") {
    return;
  }

  // In PPTX, text is in <a:t> tags (DrawingML namespace)
  if (node["a:t"]) {
    const textContent = node["a:t"];
    const textPath = [...path, "a:t"];

    if (typeof textContent === "string" && textContent.trim().length > 0) {
      textNodes.push({
        id: `t_${textNodes.length}`,
        text: textContent,
        xmlPath: textPath,
        slideFile: slideFile,
      });
    } else if (typeof textContent === "object" && textContent["#text"]) {
      const text = textContent["#text"];
      if (typeof text === "string" && text.trim().length > 0) {
        textNodes.push({
          id: `t_${textNodes.length}`,
          text: text,
          xmlPath: textPath,
          slideFile: slideFile,
        });
      }
    }
  }

  for (const key in node) {
    if (key === "@_" || key === "#text") continue;
    const child = node[key];

    if (Array.isArray(child)) {
      child.forEach((item, idx) => {
        extractTextFromNode(item, [...path, `${key}[${idx}]`], textNodes, slideFile);
      });
    } else if (typeof child === "object") {
      extractTextFromNode(child, [...path, key], textNodes, slideFile);
    }
  }
};

export const extractTextNodes = (slideXMLs: Map<string, any>): TextNode[] => {
  const textNodes: TextNode[] = [];

  for (const [slideFile, slideXML] of slideXMLs.entries()) {
    const slide = slideXML?.["p:sld"];
    if (slide) {
      extractTextFromNode(slide, ["slide"], textNodes, slideFile);
    }
  }

  return textNodes;
};

export const replaceTextInPptx = (
  pptxContent: PptxContent,
  translations: Map<string, string>
) => {
  try {
    for (const [slideFile, slideXML] of pptxContent.slideXMLs.entries()) {
      const slide = slideXML?.["p:sld"];
      if (slide) {
        replaceTextInNode(slide, translations, pptxContent.textNodes, ["slide"], slideFile);
      }
    }

    logger.info(`Replaced ${translations.size} text nodes with translations`);
    return pptxContent;
  } catch (error) {
    logger.error(`Failed to replace text: ${error instanceof Error ? error.message : String(error)}`);
    throw new AppError("Failed to replace text in PPTX", 500);
  }
};

const replaceTextInNode = (
  node: any,
  translations: Map<string, string>,
  textNodes: TextNode[],
  currentPath: string[] = [],
  slideFile: string
) => {
  if (!node || typeof node !== "object") return;

  if (node["a:t"]) {
    const textPath = [...currentPath, "a:t"];
    const pathKey = textPath.join("/");

    // Find matching node by xmlPath and slideFile
    const matchingNode = textNodes.find(
      (tn) => tn.xmlPath.join("/") === pathKey && tn.slideFile === slideFile
    );

    if (matchingNode && translations.has(matchingNode.id)) {
      const translatedText = translations.get(matchingNode.id);
      const textContent = node["a:t"];

      if (typeof textContent === "string") {
        node["a:t"] = translatedText;
      } else if (typeof textContent === "object" && textContent["#text"]) {
        node["a:t"]["#text"] = translatedText;
      }
    }
  }

  for (const key in node) {
    if (key === "@_" || key === "#text") continue;
    const child = node[key];

    if (Array.isArray(child)) {
      child.forEach((item, idx) => {
        replaceTextInNode(item, translations, textNodes, [...currentPath, `${key}[${idx}]`], slideFile);
      });
    } else if (typeof child === "object") {
      replaceTextInNode(child, translations, textNodes, [...currentPath, key], slideFile);
    }
  }
};

export const savePptx = async (pptxContent: PptxContent, outputPath: string): Promise<void> => {
  try {
    const builder = new XMLBuilder(xmlOptions);

    for (const [slideFile, slideXML] of pptxContent.slideXMLs.entries()) {
      const slideXMLString = builder.build(slideXML);
      pptxContent.zip.file(slideFile, slideXMLString);
    }

    const content = await pptxContent.zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
    });
    await fs.writeFile(outputPath, content);
    logger.info(`Saved translated PPTX to ${outputPath}`);
  } catch (error) {
    logger.error(`Failed to save PPTX: ${error instanceof Error ? error.message : String(error)}`);
    throw new AppError(`Failed to save PPTX to ${outputPath}`, 500);
  }
};

export const extractTextForTranslation = async (filePath: string) => {
  const pptxContent = await loadPptx(filePath);

  return pptxContent.textNodes.map((node) => ({
    id: node.id,
    text: node.text,
    type: "text-run" as const,
  }));
};

export const translateAndSavePptx = async (
  inputPath: string,
  outputPath: string,
  translateFn: (text: string) => string | Promise<string>
): Promise<void> => {
  try {
    const pptxContent = await loadPptx(inputPath);

    const translations = new Map<string, string>();

    for (const node of pptxContent.textNodes) {
      const translated = await translateFn(node.text);
      translations.set(node.id, translated);
    }

    const updatedContent = replaceTextInPptx(pptxContent, translations);

    await savePptx(updatedContent, outputPath);

    logger.info(`Translation complete: ${inputPath} → ${outputPath}`);
  } catch (error) {
    logger.error(`Failed to translate PPTX: ${error instanceof Error ? error.message : String(error)}`);
    throw new AppError(
      `Failed to translate PPTX: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
};
