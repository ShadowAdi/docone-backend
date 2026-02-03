import PptxParser from "node-pptx-parser";
import { logger } from "../config/logger";
import { AppError } from "./AppError";

export const extractFromPptx = async (filePath: string) => {
  try {
    const parser = new PptxParser(filePath);
    const textContent = await parser.extractText();
    
    const allLines: Array<{ id: string; text: string; type: "line" }> = [];
    let lineCounter = 0;
    
    // Extract text from each slide
    textContent.forEach((slide) => {
      // Add each line from the slide
      slide.text.forEach((line) => {
        if (line.trim().length > 0) {
          allLines.push({
            id: `line_${lineCounter}`,
            text: line.trim(),
            type: "line" as const,
          });
          lineCounter++;
        }
      });
    });
    
    return allLines;
  } catch (error) {
    const actualError = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to extract from .pptx file: ${filePath} - Error: ${actualError}`);
    throw new AppError(`Failed to extract from .pptx file: ${actualError}`, 500);
  }
};
