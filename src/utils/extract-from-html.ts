import * as fs from "fs/promises";
import { logger } from "../config/logger";
import { AppError } from "./AppError";
import * as cheerio from "cheerio";

/**
 * Extract text content from HTML files
 */
export const extractFromHtml = async (filePath: string): Promise<string> => {
  try {
    logger.info(`Extracting text from HTML file: ${filePath}`);

    const htmlContent = await fs.readFile(filePath, "utf-8");
    const $ = cheerio.load(htmlContent);

    // Remove script and style elements
    $("script, style, noscript").remove();

    // Get text content
    let text = $("body").text();

    // If no body tag, get all text
    if (!text || text.trim().length === 0) {
      text = $.text();
    }

    // Clean up whitespace
    text = text
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, "\n\n") // Keep paragraph breaks
      .trim();

    logger.info(`Successfully extracted ${text.length} characters from HTML file`);
    return text;
  } catch (error: any) {
    logger.error(`Failed to extract from HTML: ${error.message}`);
    throw new AppError(`Failed to extract text from HTML file: ${error.message}`, 500);
  }
};
