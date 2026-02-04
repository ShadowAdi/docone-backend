import { logger } from "../config/logger";
import { AppError } from "./AppError";
import { extractTextForTranslation as extractFromDocxXml, translateAndSaveDocx } from "./docx-xml-handler";
import { extractTextForTranslation as extractFromPptxXml, translateAndSavePptx } from "./pptx-xml-handler";
import { convertPdfToDocx, convertDocxToPdf, cleanupTempFile } from "./pdf-converter-new";
import { extractFromTxt } from "./extract-from-txt";
import { extractFromMarkdown } from "./extract-from-markdown";
import { extractFromHtml } from "./extract-from-html";
import { extractFromCsv } from "./extract-from-csv";
import { extractFromRtf } from "./extract-from-rtf";
import * as fs from "fs/promises";
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
 * PDF uses ConvertAPI for conversion
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

      case ".txt":
        return await extractFromTxtFile(filePath);

      case ".md":
      case ".markdown":
        return await extractFromMarkdownFile(filePath);

      case ".html":
      case ".htm":
        return await extractFromHtmlFile(filePath);

      case ".csv":
        return await extractFromCsvFile(filePath);

      case ".rtf":
        return await extractFromRtfFile(filePath);

      default:
        throw new AppError(
          `Unsupported file format: ${extension}. Supported formats: .docx, .pdf, .pptx, .txt, .md, .html, .csv, .rtf`,
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
 * PDF: ConvertAPI (PDF → DOCX → translate → PDF)
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

      case ".txt":
      case ".md":
      case ".markdown":
      case ".html":
      case ".htm":
      case ".csv":
      case ".rtf":
        return await translateAndSaveTextFile(inputPath, outputPath, translateFn, extension);

      default:
        throw new AppError(
          `Unsupported file format: ${extension}. Supported formats: .docx, .pdf, .pptx, .txt, .md, .html, .csv, .rtf`,
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
 * Translate and save PDF files (WORKING via ConvertAPI)
 * Converts PDF → DOCX → Translate → PDF
 */
const translateAndSavePdfFile = async (
  inputPath: string,
  outputPath: string,
  translateFn: TranslateFn
): Promise<void> => {
  logger.info(`Using PDF translation (via ConvertAPI) for: ${inputPath}`);
  
  let tempDocxPath: string | null = null;
  let translatedDocxPath: string | null = null;

  try {
    // Step 1: Convert PDF to DOCX
    tempDocxPath = await convertPdfToDocx(inputPath);

    // Step 2: Translate the DOCX
    translatedDocxPath = tempDocxPath.replace("-temp.docx", "-translated.docx");
    await translateAndSaveDocx(tempDocxPath, translatedDocxPath, translateFn);

    // Step 3: Convert translated DOCX back to PDF
    try {
      await convertDocxToPdf(translatedDocxPath, outputPath);
      logger.info(`PDF translation complete: ${inputPath} → ${outputPath}`);
    } catch (pdfError) {
      // If PDF conversion fails, just rename the DOCX to match the output path
      logger.warn(`DOCX to PDF conversion failed, keeping DOCX format instead`);
      const docxOutputPath = outputPath.replace(".pdf", ".docx");
      await fs.rename(translatedDocxPath, docxOutputPath);
      translatedDocxPath = null; // Don't cleanup since we renamed it
      logger.info(`PDF translation complete (as DOCX): ${inputPath} → ${docxOutputPath}`);
    }
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

/**
 * Translate and save text-based files (TXT, MD, HTML, CSV, RTF)
 */
const translateAndSaveTextFile = async (
  inputPath: string,
  outputPath: string,
  translateFn: TranslateFn,
  extension: string
): Promise<void> => {
  logger.info(`Translating text-based file: ${inputPath}`);
  
  try {
    // Extract text nodes
    const textNodes = await extractFromDocument(inputPath);
    
    // Translate all text nodes
    const translatedTexts = await Promise.all(
      textNodes.map(async (node) => {
        const translated = await translateFn(node.text);
        return typeof translated === 'string' ? translated : node.text;
      })
    );
    
    // Combine translated text
    const translatedContent = translatedTexts.join("\n\n");
    
    // Write to output file
    await fs.writeFile(outputPath, translatedContent, "utf-8");
    
    logger.info(`Text-based file translation complete: ${inputPath} → ${outputPath}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to translate text-based file: ${errorMessage}`);
    throw new AppError(`Failed to translate text-based file: ${errorMessage}`, 500);
  }
};

/**
 * Extract text from TXT files
 */
const extractFromTxtFile = async (
  filePath: string
): Promise<ExtractedTextNode[]> => {
  logger.info(`Using TXT extraction for: ${filePath}`);
  const text = await extractFromTxt(filePath);
  return [{ id: "txt-1", text, type: "text-run" }];
};

/**
 * Extract text from Markdown files
 */
const extractFromMarkdownFile = async (
  filePath: string
): Promise<ExtractedTextNode[]> => {
  logger.info(`Using Markdown extraction for: ${filePath}`);
  const text = await extractFromMarkdown(filePath, false);
  return [{ id: "md-1", text, type: "text-run" }];
};

/**
 * Extract text from HTML files
 */
const extractFromHtmlFile = async (
  filePath: string
): Promise<ExtractedTextNode[]> => {
  logger.info(`Using HTML extraction for: ${filePath}`);
  const text = await extractFromHtml(filePath);
  return [{ id: "html-1", text, type: "text-run" }];
};

/**
 * Extract text from CSV files
 */
const extractFromCsvFile = async (
  filePath: string
): Promise<ExtractedTextNode[]> => {
  logger.info(`Using CSV extraction for: ${filePath}`);
  const text = await extractFromCsv(filePath);
  return [{ id: "csv-1", text, type: "text-run" }];
};

/**
 * Extract text from RTF files
 */
const extractFromRtfFile = async (
  filePath: string
): Promise<ExtractedTextNode[]> => {
  logger.info(`Using RTF extraction for: ${filePath}`);
  const text = await extractFromRtf(filePath);
  return [{ id: "rtf-1", text, type: "text-run" }];
};