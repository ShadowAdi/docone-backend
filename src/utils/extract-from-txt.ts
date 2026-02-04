import * as fs from "fs/promises";
import { logger } from "../config/logger";
import { AppError } from "./AppError";

/**
 * Extract text content from TXT files
 */
export const extractFromTxt = async (filePath: string): Promise<string> => {
  try {
    logger.info(`Extracting text from TXT file: ${filePath}`);

    const content = await fs.readFile(filePath, "utf-8");
    
    logger.info(`Successfully extracted ${content.length} characters from TXT file`);
    return content.trim();
  } catch (error: any) {
    logger.error(`Failed to extract from TXT: ${error.message}`);
    throw new AppError(`Failed to extract text from TXT file: ${error.message}`, 500);
  }
};
