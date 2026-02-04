import CloudConvert from "cloudconvert";
import { AppError } from "./AppError";
import { logger } from "../config/logger";
import { CLOUD_CONVERT_API_KEY } from "../config/dotenv";
import * as fs from "fs/promises";
import * as path from "path";
import axios from "axios";

if (!CLOUD_CONVERT_API_KEY) {
  logger.error("CLOUD_CONVERT_API_KEY is not set in environment variables");
}

const cloudConvert = new CloudConvert(CLOUD_CONVERT_API_KEY || "");

/**
 * Convert PDF to DOCX using CloudConvert API
 * Returns the path to the temporary DOCX file
 */
export const convertPdfToDocx = async (pdfPath: string): Promise<string> => {
  try {
    logger.info(`Converting PDF to DOCX: ${pdfPath}`);

    const job = await cloudConvert.jobs.create({
      tasks: {
        "upload-pdf": {
          operation: "import/upload",
        },
        "convert-to-docx": {
          operation: "convert",
          input: "upload-pdf",
          output_format: "docx",
        },
        "export-docx": {
          operation: "export/url",
          input: "convert-to-docx",
        },
      },
    });

    // Upload the PDF file
    const uploadTask = job.tasks?.find((task) => task.name === "upload-pdf");
    if (!uploadTask?.result?.form) {
      throw new AppError("Failed to get upload URL from CloudConvert", 500);
    }

    const fileStream = await fs.readFile(pdfPath);
    await cloudConvert.tasks.upload(uploadTask, fileStream, path.basename(pdfPath));

    // Wait for the conversion to complete
    const completedJob = await cloudConvert.jobs.wait(job.id);

    // Download the converted DOCX
    const exportTask = completedJob.tasks?.find((task) => task.name === "export-docx");
    if (!exportTask?.result?.files?.[0]?.url) {
      throw new AppError("Failed to get download URL from CloudConvert", 500);
    }

    const downloadUrl = exportTask.result.files[0].url;
    const tempDocxPath = pdfPath.replace(".pdf", "-temp.docx");

    // Download the file
    const response = await axios.get(downloadUrl, { responseType: "arraybuffer" });
    await fs.writeFile(tempDocxPath, Buffer.from(response.data));

    logger.info(`PDF converted to DOCX: ${tempDocxPath}`);
    return tempDocxPath;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to convert PDF to DOCX: ${errorMessage}`);
    throw new AppError(`Failed to convert PDF to DOCX: ${errorMessage}`, 500);
  }
};

/**
 * Convert DOCX to PDF using CloudConvert API
 */
export const convertDocxToPdf = async (docxPath: string, outputPdfPath: string): Promise<void> => {
  try {
    logger.info(`Converting DOCX to PDF: ${docxPath} → ${outputPdfPath}`);

    const job = await cloudConvert.jobs.create({
      tasks: {
        "upload-docx": {
          operation: "import/upload",
        },
        "convert-to-pdf": {
          operation: "convert",
          input: "upload-docx",
          output_format: "pdf",
        },
        "export-pdf": {
          operation: "export/url",
          input: "convert-to-pdf",
        },
      },
    });

    // Upload the DOCX file
    const uploadTask = job.tasks?.find((task) => task.name === "upload-docx");
    if (!uploadTask?.result?.form) {
      throw new AppError("Failed to get upload URL from CloudConvert", 500);
    }

    const fileStream = await fs.readFile(docxPath);
    await cloudConvert.tasks.upload(uploadTask, fileStream, path.basename(docxPath));

    // Wait for the conversion to complete
    const completedJob = await cloudConvert.jobs.wait(job.id);

    // Download the converted PDF
    const exportTask = completedJob.tasks?.find((task) => task.name === "export-pdf");
    if (!exportTask?.result?.files?.[0]?.url) {
      throw new AppError("Failed to get download URL from CloudConvert", 500);
    }

    const downloadUrl = exportTask.result.files[0].url;

    // Download the file
    const response = await axios.get(downloadUrl, { responseType: "arraybuffer" });
    await fs.writeFile(outputPdfPath, Buffer.from(response.data));

    logger.info(`DOCX converted to PDF: ${outputPdfPath}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to convert DOCX to PDF: ${errorMessage}`);
    throw new AppError(`Failed to convert DOCX to PDF: ${errorMessage}`, 500);
  }
};

/**
 * Cleanup temporary files
 */
export const cleanupTempFile = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath);
    logger.info(`Cleaned up temporary file: ${filePath}`);
  } catch (error) {
    logger.warn(`Failed to cleanup temporary file ${filePath}: ${error}`);
  }
};
