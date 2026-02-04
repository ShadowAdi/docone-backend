import axios from "axios";
import { AppError } from "./AppError";
import { logger } from "../config/logger";
import { CONVERT_API_SECRET_SANDBOX } from "../config/dotenv";
import * as fs from "fs/promises";
import FormData from "form-data";

if (!CONVERT_API_SECRET_SANDBOX) {
  logger.warn("CONVERT_API_SECRET_SANDBOX is not set - PDF conversion will not work");
}

/**
 * Convert PDF to DOCX using ConvertAPI REST API
 */
export const convertPdfToDocx = async (pdfPath: string): Promise<string> => {
  try {
    logger.info(`Converting PDF to DOCX using ConvertAPI: ${pdfPath}`);

    if (!CONVERT_API_SECRET_SANDBOX) {
      throw new AppError("CONVERT_API_SECRET_SANDBOX is not set in .env file", 500);
    }

    const formData = new FormData();
    const pdfBuffer = await fs.readFile(pdfPath);
    formData.append("File", pdfBuffer, "input.pdf");

    const response = await axios.post(
      `https://v2.convertapi.com/convert/pdf/to/docx?Secret=${CONVERT_API_SECRET_SANDBOX}`,
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    if (!response.data.Files || response.data.Files.length === 0) {
      throw new AppError("No file returned from ConvertAPI", 500);
    }

    const fileData = response.data.Files[0].FileData;
    if (!fileData) {
      throw new AppError("No FileData in ConvertAPI response", 500);
    }

    const tempDocxPath = pdfPath.replace(".pdf", "-temp.docx");
    const fileBuffer = Buffer.from(fileData, "base64");
    await fs.writeFile(tempDocxPath, fileBuffer);

    logger.info(`PDF converted to DOCX: ${tempDocxPath}`);
    return tempDocxPath;
  } catch (error: any) {
    logger.error(`ConvertAPI error: ${error.message}`);
    if (error.response) {
      logger.error(`API Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw new AppError(`Failed to convert PDF to DOCX: ${error.message}`, 500);
  }
};

/**
 * Convert DOCX to PDF using ConvertAPI REST API
 */
export const convertDocxToPdf = async (docxPath: string, outputPdfPath: string): Promise<void> => {
  try {
    logger.info(`Converting DOCX to PDF using ConvertAPI: ${docxPath}`);

    if (!CONVERT_API_SECRET_SANDBOX) {
      throw new AppError("CONVERT_API_SECRET_SANDBOX is not set in .env file", 500);
    }

    const formData = new FormData();
    const docxBuffer = await fs.readFile(docxPath);
    formData.append("File", docxBuffer, "input.docx");

    const response = await axios.post(
      `https://v2.convertapi.com/convert/docx/to/pdf?Secret=${CONVERT_API_SECRET_SANDBOX}`,
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    if (!response.data.Files || response.data.Files.length === 0) {
      throw new AppError("No file returned from ConvertAPI", 500);
    }
    
    const fileData = response.data.Files[0].FileData;
    if (!fileData) {
      throw new AppError("No FileData in ConvertAPI response", 500);
    }

    const pdfBuffer = Buffer.from(fileData, "base64");
    await fs.writeFile(outputPdfPath, pdfBuffer);

    logger.info(`DOCX converted to PDF: ${outputPdfPath}`);
  } catch (error: any) {
    logger.error(`ConvertAPI error: ${error.message}`);
    if (error.response) {
      logger.error(`API Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
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
