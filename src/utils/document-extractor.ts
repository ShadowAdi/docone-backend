import { logger } from "../config/logger";
import { AppError } from "./AppError";
import { extractTextForTranslation as extractFromDocxXml, translateAndSaveDocx } from "./docx-xml-handler";
import { extractTextForTranslation as extractFromPptxXml, translateAndSavePptx } from "./pptx-xml-handler";
import { convertPdfToDocxDirect } from "./pdf-converter-direct";
import { convertDocxToPdf, cleanupTempFile } from "./pdf-converter";
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
 * DOCX and PPTX are fully working with structure preservation
 * PDF uses CloudConvert API for conversion
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
  return await extractFromDocxXml(filePath);
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
 * Extract text from PPTX files (WORKING)
 * Uses XML-based extraction to preserve presentation structure
 */
const extractFromPptxFile = async (
  filePath: string
): Promise<ExtractedTextNode[]> => {
  logger.info(`Using PPTX extraction for: ${filePath}`);
  return await extractFromPptxXml(filePath);
};


/**
 * Translate and save document to a new file
 * Automatically detects format and uses appropriate handler
 * DOCX and PPTX: Direct XML manipulation (preserves structure)
 * PDF: CloudConvert API (PDF → DOCX → translate → PDF)
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
 * Translate and save PDF files (WORKING via CloudConvert)
 * Converts PDF → DOCX → Translate → PDF
 */
const translateAndSavePdfFile = async (
  inputPath: string,
  outputPath: string,
  translateFn: TranslateFn
): Promise<void> => {
  logger.info(`Using PDF translation (via CloudConvert Direct API) for: ${inputPath}`);
  
  let tempDocxPath: string | null = null;
  let translatedDocxPath: string | null = null;

  try {
    // Step 1: Convert PDF to DOCX using direct API (bypasses SDK issues)
    tempDocxPath = await convertPdfToDocxDirect(inputPath);

    // Step 2: Translate the DOCX
    translatedDocxPath = tempDocxPath.replace("-temp.docx", "-translated.docx");
    await translateAndSaveDocx(tempDocxPath, translatedDocxPath, translateFn);

    // Step 3: Convert translated DOCX back to PDF
    await convertDocxToPdf(translatedDocxPath, outputPath);

    logger.info(`PDF translation complete: ${inputPath} → ${outputPath}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to translate PDF: ${errorMessage}`);
    throw new AppError(`Failed to translate PDF: ${errorMessage}`, 500);
  } finally {
    // Cleanup temporary files
    if (tempDocxPath) await cleanupTempFile(tempDocxPath);
    if (translatedDocxPath) await cleanupTempFile(translatedDocxPath);
  }
};

/**
 * Translate and save PPTX files (WORKING)
 * Preserves presentation structure, formatting, layouts, etc.
 */
const translateAndSavePptxFile = async (
  inputPath: string,
  outputPath: string,
  translateFn: TranslateFn
): Promise<void> => {
  logger.info(`Using PPTX translation for: ${inputPath}`);
  return await translateAndSavePptx(inputPath, outputPath, translateFn);
};