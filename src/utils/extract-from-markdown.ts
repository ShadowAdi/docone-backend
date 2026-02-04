import * as fs from "fs/promises";
import { logger } from "../config/logger";
import { AppError } from "./AppError";

/**
 * Extract text content from Markdown files
 * Optionally can strip markdown syntax to get plain text
 */
export const extractFromMarkdown = async (
  filePath: string,
  stripMarkdown: boolean = false
): Promise<string> => {
  try {
    logger.info(`Extracting text from Markdown file: ${filePath}`);

    let content = await fs.readFile(filePath, "utf-8");

    if (stripMarkdown) {
      // Remove markdown syntax for plain text
      content = content
        // Remove headers
        .replace(/^#{1,6}\s+/gm, "")
        // Remove bold/italic
        .replace(/(\*\*|__)(.*?)\1/g, "$2")
        .replace(/(\*|_)(.*?)\1/g, "$2")
        // Remove links [text](url)
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
        // Remove images ![alt](url)
        .replace(/!\[([^\]]*)\]\([^\)]+\)/g, "$1")
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, "")
        .replace(/`([^`]+)`/g, "$1")
        // Remove horizontal rules
        .replace(/^(-{3,}|_{3,}|\*{3,})$/gm, "")
        // Remove blockquotes
        .replace(/^>\s+/gm, "")
        // Clean up extra whitespace
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }

    logger.info(`Successfully extracted ${content.length} characters from Markdown file`);
    return content;
  } catch (error: any) {
    logger.error(`Failed to extract from Markdown: ${error.message}`);
    throw new AppError(`Failed to extract text from Markdown file: ${error.message}`, 500);
  }
};
