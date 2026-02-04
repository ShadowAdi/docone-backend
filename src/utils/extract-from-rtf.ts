import * as fs from "fs/promises";
import { logger } from "../config/logger";
import { AppError } from "./AppError";

/**
 * Extract text content from RTF files
 * Simple RTF parser that strips RTF control codes
 */
export const extractFromRtf = async (filePath: string): Promise<string> => {
  try {
    logger.info(`Extracting text from RTF file: ${filePath}`);

    const rtfContent = await fs.readFile(filePath, "utf-8");

    // Basic RTF text extraction
    let text = rtfContent
      // Remove RTF header
      .replace(/^\{\\rtf1[^\{]*/, "")
      // Remove control words with parameters
      .replace(/\\[a-z]+(-?\d+)?[ ]?/g, "")
      // Remove control symbols
      .replace(/\\[^a-z]/g, "")
      // Remove braces
      .replace(/[\{\}]/g, "")
      // Remove extra whitespace
      .replace(/\s+/g, " ")
      .trim();

    logger.info(`Successfully extracted ${text.length} characters from RTF file`);
    return text;
  } catch (error: any) {
    logger.error(`Failed to extract from RTF: ${error.message}`);
    throw new AppError(`Failed to extract text from RTF file: ${error.message}`, 500);
  }
};
