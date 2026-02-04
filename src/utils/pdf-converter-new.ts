import ConvertAPI from "convertapi";
import { AppError } from "./AppError";
import { logger } from "../config/logger";
import { CONVERT_API_SECRET } from "../config/dotenv";

if (!CONVERT_API_SECRET) {
  logger.warn("CONVERT_API_SECRET is not set - PDF conversion will not work");
}

const convertapi = new ConvertAPI(CONVERT_API_SECRET || "");

/**
 * Convert PDF to DOCX using ConvertAPI official package
 */
export const convertPdfToDocx = async (pdfPath: string): Promise<string> => {
  try {
    logger.info(`Converting PDF to DOCX using ConvertAPI: ${pdfPath}`);

    if (!CONVERT_API_SECRET) {
      throw new AppError("CONVERT_API_SECRET is not set in .env file", 500);
    }

    const result = await convertapi.convert("docx", { File: pdfPath }, "pdf");

    const tempDocxPath = pdfPath.replace(".pdf", "-temp.docx");
    await result.saveFiles(tempDocxPath);

    logger.info(`PDF converted to DOCX: ${tempDocxPath}`);
    return tempDocxPath;
  } catch (error: any) {
    logger.error(`ConvertAPI error: ${error.message}`);
    throw new AppError(`Failed to convert PDF to DOCX: ${error.message}`, 500);
  }
};

/**
 * Convert DOCX to PDF using ConvertAPI official package
 */
export const convertDocxToPdf = async (docxPath: string, outputPdfPath: string): Promise<void> => {
  try {
    logger.info(`Converting DOCX to PDF using ConvertAPI: ${docxPath}`);

    if (!CONVERT_API_SECRET) {
      throw new AppError("CONVERT_API_SECRET is not set in .env file", 500);
    }

    const result = await convertapi.convert("pdf", { File: docxPath }, "docx");

    await result.saveFiles(outputPdfPath);

    logger.info(`DOCX converted to PDF: ${outputPdfPath}`);
  } catch (error: any) {
    logger.error(`ConvertAPI error: ${error.message}`);
    throw new AppError(`Failed to convert DOCX to PDF: ${error.message}`, 500);
  }
};

/**
 * Cleanup temporary files
 */
export const cleanupTempFile = async (filePath: string): Promise<void> => {
  try {
    const fs = await import("fs/promises");
    await fs.unlink(filePath);
    logger.info(`Cleaned up temporary file: ${filePath}`);
  } catch (error) {
    logger.warn(`Failed to cleanup temporary file ${filePath}: ${error}`);
  }
};
