import axios from "axios";
import { AppError } from "./AppError";
import { logger } from "../config/logger";
import { CONVERT_API_SECRET_SANDBOX } from "../config/dotenv";
import * as fs from "fs/promises";
import FormData from "form-data";

const CLOUDCONVERT_API_URL = "https://api.cloudconvert.com/v2";

/**
 * Direct API implementation - bypasses SDK issues
 */
export const convertPdfToDocxDirect = async (pdfPath: string): Promise<string> => {
  try {
    logger.info(`Converting PDF to DOCX (direct API): ${pdfPath}`);

    // Step 1: Create job
    const jobResponse = await axios.post(
      `${CLOUDCONVERT_API_URL}/jobs`,
      {
        tasks: {
          "import-my-file": {
            operation: "import/upload",
          },
          "convert-my-file": {
            operation: "convert",
            input: "import-my-file",
            output_format: "docx",
          },
          "export-my-file": {
            operation: "export/url",
            input: "convert-my-file",
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${CONVERT_API_SECRET_SANDBOX}`,
          "Content-Type": "application/json",
        },
      }
    );

    logger.info(`Job created: ${jobResponse.data.id}`);

    // Step 2: Upload file
    const uploadTask = jobResponse.data.data.tasks.find(
      (t: any) => t.name === "import-my-file"
    );

    const fileBuffer = await fs.readFile(pdfPath);
    const formData = new FormData();
    formData.append("file", fileBuffer, "input.pdf");

    await axios.post(uploadTask.result.form.url, formData, {
      headers: formData.getHeaders(),
    });

    logger.info("File uploaded successfully");

    // Step 3: Wait for conversion
    let job = jobResponse.data.data;
    while (job.status !== "finished" && job.status !== "error") {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResponse = await axios.get(
        `${CLOUDCONVERT_API_URL}/jobs/${job.id}`,
        {
          headers: {
            Authorization: `Bearer ${CONVERT_API_SECRET_SANDBOX}`,
          },
        }
      );
      job = statusResponse.data.data;
      logger.info(`Job status: ${job.status}`);
    }

    if (job.status === "error") {
      throw new AppError("Conversion failed", 500);
    }

    // Step 4: Download result
    const exportTask = job.tasks.find((t: any) => t.name === "export-my-file");
    const downloadUrl = exportTask.result.files[0].url;

    const response = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
    });

    const tempDocxPath = pdfPath.replace(".pdf", "-temp.docx");
    await fs.writeFile(tempDocxPath, Buffer.from(response.data));

    logger.info(`PDF converted to DOCX: ${tempDocxPath}`);
    return tempDocxPath;
  } catch (error: any) {
    logger.error(`Direct API conversion failed: ${error.message}`);
    if (error.response) {
      logger.error(`API Error: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw new AppError(`Failed to convert PDF: ${error.message}`, 500);
  }
};
