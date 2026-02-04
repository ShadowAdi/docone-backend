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

interface DocContent {
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

    const textNodes = extractTextNodes(documentXML, headerXMLs, footerXmls);

    logger.info(`Loaded DOCX with ${textNodes.length} text nodes`);

    return {
      zip,
      documentXML,
      headerXMLs,
      footerXmls,
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

