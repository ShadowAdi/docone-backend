import * as fs from "fs/promises";
import { logger } from "../config/logger";
import { AppError } from "./AppError";
import { parse } from "csv-parse/sync";

/**
 * Extract text content from CSV files
 * Converts CSV data to readable text format
 */
export const extractFromCsv = async (
  filePath: string,
  options?: {
    delimiter?: string;
    includeHeaders?: boolean;
  }
): Promise<string> => {
  try {
    logger.info(`Extracting text from CSV file: ${filePath}`);

    const fileContent = await fs.readFile(filePath, "utf-8");

    const records = parse(fileContent, {
      delimiter: options?.delimiter || ",",
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    if (!records || records.length === 0) {
      return "";
    }

    let text = "";
    const includeHeaders = options?.includeHeaders !== false;

    // First row as headers
    if (includeHeaders && records.length > 0) {
      text += records[0].join(" | ") + "\n";
      text += records[0].map(() => "---").join(" | ") + "\n";
    }

    // Data rows
    const startIndex = includeHeaders ? 1 : 0;
    for (let i = startIndex; i < records.length; i++) {
      text += records[i].join(" | ") + "\n";
    }

    logger.info(`Successfully extracted ${text.length} characters from CSV file`);
    return text.trim();
  } catch (error: any) {
    logger.error(`Failed to extract from CSV: ${error.message}`);
    throw new AppError(`Failed to extract text from CSV file: ${error.message}`, 500);
  }
};
