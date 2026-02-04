import { logger } from "../config/logger";
import { AppError } from "./AppError";
import { extractTextForTranslation } from "./docx-xml-handler";

/**
 * Extract text from DOCX while preserving structure
 * This uses XML manipulation to maintain layout, images, tables, and styles
 */
export const extractFromDocx = async (filePath: string) => {
  try {
    logger.info(`Extracting text from DOCX: ${filePath}`);
    
    // Use the new XML-based extraction that preserves structure
    const textNodes = await extractTextForTranslation(filePath);
    
    logger.info(`Extracted ${textNodes.length} text nodes from DOCX`);
    return textNodes;
  } catch (error) {
    logger.error(`Failed to extract docx from the given file path: ${filePath}`);
    console.error(
      `Failed to extract docx from the given file path: ${filePath}`,
      error
    );
    throw new AppError(
      `Failed to extract docx from the given file path: ${filePath}`,
      500,
    );
  }
};
