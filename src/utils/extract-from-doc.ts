import { logger } from "../config/logger"
import { AppError } from "./AppError"
import fs from "fs";
import { extractRawText } from "mammoth";

export const extractFromDoc = async (filePath: string) => {
    try {
        const buffer = fs.readFileSync(filePath)
        const result = await extractRawText({ buffer })

        const lines = result.value.split("\n")

        return lines.filter((line) => line.trim().length > 0).map((text, i) => ({
            id: `line_${i}`,
            text: text.trim(),
            type: 'line' as const
        }))

    } catch (error) {
        const errorMessage = `Failed to extract from .doc file: ${filePath}`;
        logger.error(errorMessage);
        throw new AppError(errorMessage, 500);
    }
}