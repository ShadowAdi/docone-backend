import { logger } from "../config/logger";
import { AppError } from "./AppError";
import { extractTextForTranslation, translateAndSaveDocx } from "./docx-xml-handler";
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
 * Type for translation function
 */
export type TranslateFn = (text: string) => string | Promise<string>;

/**
 * Extract text from any supported document format
 * Currently only DOCX is fully working with structure preservation
 * PDF, PPTX formats are not yet implemented
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

      default:
        throw new AppError(
          `Unsupported file format: ${extension}. Supported formats: .docx, .pdf, .pptx`,
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
 * Translate and save document to a new file
 * Automatically detects format and uses appropriate handler
 * Currently only DOCX is fully working with structure preservation
 */
export const translateAndSaveDocument = async (
  inputPath: string,
  outputPath: string,
  translateFn: TranslateFn
): Promise<void> => {
  const extension = path.extname(inputPath).toLowerCase();

  logger.info(`Translating document: ${inputPath} → ${outputPath} (${extension})`);

  try {
    switch (extension) {
      case ".docx":
        return await translateAndSaveDocxFile(inputPath, outputPath, translateFn);

      case ".pdf":
        return await translateAndSavePdfFile(inputPath, outputPath, translateFn);

      case ".pptx":
        return await translateAndSavePptxFile(inputPath, outputPath, translateFn);

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to translate ${inputPath}: ${errorMessage}`);
    throw new AppError(
      `Failed to translate and save document: ${errorMessage}`,
      500
    );
  }
};

/**
 * Translate and save DOCX files (WORKING)
 * Preserves document structure, formatting, images, tables, etc.
 */
const translateAndSaveDocxFile = async (
  inputPath: string,
  outputPath: string,
  translateFn: TranslateFn
): Promise<void> => {
  logger.info(`Using DOCX translation for: ${inputPath}`);
  return await translateAndSaveDocx(inputPath, outputPath, translateFn);
};

/**
 * Translate and save PDF files (NOT WORKING YET)
 * Placeholder implementation - logs error and throws
 */
const translateAndSavePdfFile = async (
  inputPath: string,
  outputPath: string,
  translateFn: TranslateFn
): Promise<void> => {
  logger.warn(`PDF translation is not yet implemented: ${inputPath}`);
  logger.error(`PDF format (.pdf) translation is currently not supported`);
  throw new AppError(
    "PDF translation is not yet implemented. Please use DOCX format.",
    501
  );
};

/**
 * Translate and save PPTX files (NOT WORKING YET)
 * Placeholder implementation - logs error and throws
 */
const translateAndSavePptxFile = async (
  inputPath: string,
  outputPath: string,
  translateFn: TranslateFn
): Promise<void> => {
  logger.warn(`PPTX translation is not yet implemented: ${inputPath}`);
  logger.error(`PPTX format (.pptx) translation is currently not supported`);
  throw new AppError(
    "PPTX translation is not yet implemented. Please use DOCX format.",
    501
  );
};