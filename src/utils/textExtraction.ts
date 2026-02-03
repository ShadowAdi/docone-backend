import { logger } from "../config/logger"
import { AppError } from "./AppError"
import { ExtractedDocument } from "./extract-doc"

export const TextExtraction=async (filePath:string)=>{
    try {
        logger.info(`Processing file: ${filePath}`);
        const response=await ExtractedDocument(filePath);
        logger.info(`Successfully extracted text from: ${filePath}`);
        return response;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Text extraction failed for ${filePath}: ${errorMessage}`);
        throw error instanceof AppError ? error : new AppError(`Failed to extract text: ${errorMessage}`, 500);
    }
}