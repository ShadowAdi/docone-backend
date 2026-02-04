import JSZip from "jszip";
import { AppError } from "./AppError";
import { logger } from "../config/logger";
import * as fs from "fs/promises";

interface TextNode{
  id:string;
  text:string;
  xmlPath:string[]
}

interface DocContent{
zip:JSZip;
documentXML:any;
headerXMLs:Map<string,any>;
footerXMLs:Map<string,any>;
textNodes:TextNode[]
}

const xmlOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  format: true,
  preserveOrder: false,
};


export const loadDocx=async (filePath:string)=>{
  try {
    const data=await fs.readFile(filePath)
    const zip=await JSZip.loadAsync(data)

    // const parser=new XMLPa
  } catch (error) {
    logger .error(`Failed to load DOCX: ${error instanceof Error ? error.message : String(error)}`);
    throw new AppError(`Failed to load DOCX from ${filePath}`, 500);
  }
}