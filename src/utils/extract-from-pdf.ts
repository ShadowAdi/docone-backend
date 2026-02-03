import { logger } from "../config/logger"
import { AppError } from "./AppError"
import WordExtractor from "word-extractor";


export const extractFromPdf = async (filePath: string) => {
    try {
        const extractor = new WordExtractor()
        const extracted = await extractor.extract(filePath)
        const text = extracted.getBody()
        const lines = text.split("\n");
        return lines.filter((line) => line.trim().length > 0).map((text, i) => ({
            id: `line_${i}`,
            text: text.trim(),
            type: 'line' as const
        }))
    } catch (error) {
        const actualError = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to extract from .pdf file: ${filePath} - Error: ${actualError}`);
        throw new AppError(`Failed to extract from .pdf file: ${actualError}`, 500);
    }
}