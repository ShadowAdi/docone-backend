import { logger } from "../config/logger";
import { AppError } from "./AppError";
import { extractTextForTranslation } from "./docx-xml-handler";
import path from "path";

/**
 * Common interface for extracted text nodes
 */
export interface ExtractedTextNode {
  id: string;
  text: string;
  type: "text-run" | "line";
}

/**
 * Extract text from any supported document format
 * Currently only DOCX is fully working with structure preservation
 * PDF, PPTX, and DOC formats are not yet implemented
 */
export const extractFromDocument = async (
  filePath: string
): Promise<ExtractedTextNode[]> => {
  const extension = path.extname(filePath).toLowerCase();

  logger.info(`Extracting text from document: ${filePath} (${extension})`);

  try {
    switch (extension) {
      case ".docx":
        return await extractFromDocxFile(filePath);

      case ".pdf":
        return await extractFromPdfFile(filePath);

      case ".pptx":
        return await extractFromPptxFile(filePath);

      case ".doc":
        return await extractFromDocFile(filePath);

      default:
        throw new AppError(
          `Unsupported file format: ${extension}. Supported formats: .docx, .pdf, .pptx, .doc`,
          400
        );
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    logger.error(`Failed to extract from ${filePath}: ${errorMessage}`);
    throw new AppError(
      `Failed to extract text from document: ${errorMessage}`,
      500
    );
  }
};

/**
 * Extract text from DOCX files (WORKING)
 * Uses XML-based extraction to preserve document structure
 */
const extractFromDocxFile = async (
  filePath: string
): Promise<ExtractedTextNode[]> => {
  logger.info(`Using DOCX extraction for: ${filePath}`);
  return await extractTextForTranslation(filePath);
};

/**
 * Extract text from PDF files (NOT WORKING YET)
 * Placeholder implementation - logs error and throws
 */
const extractFromPdfFile = async (
  filePath: string
): Promise<ExtractedTextNode[]> => {
  logger.warn(`PDF extraction is not yet implemented: ${filePath}`);
  logger.error(`PDF format (.pdf) is currently not supported`);
  throw new AppError(
    "PDF extraction is not yet implemented. Please use DOCX format.",
    501
  );
};

/**
 * Extract text from PPTX files (NOT WORKING YET)
 * Placeholder implementation - logs error and throws
 */
const extractFromPptxFile = async (
  filePath: string
): Promise<ExtractedTextNode[]> => {
  logger.warn(`PPTX extraction is not yet implemented: ${filePath}`);
  logger.error(`PPTX format (.pptx) is currently not supported`);
  throw new AppError(
    "PPTX extraction is not yet implemented. Please use DOCX format.",
    501
  );
};

/**
 * Extract text from DOC files (NOT WORKING YET)
 * Placeholder implementation - logs error and throws
 */
const extractFromDocFile = async (
  filePath: string
): Promise<ExtractedTextNode[]> => {
  logger.warn(`DOC extraction is not yet implemented: ${filePath}`);
  logger.error(`DOC format (.doc) is currently not supported`);
  throw new AppError(
    "DOC extraction is not yet implemented. Please use DOCX format.",
    501
  );
};
