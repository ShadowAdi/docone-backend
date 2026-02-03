import { logger } from "../config/logger"
import { AppError } from "./AppError"
import { extractFromDoc } from "./extract-from-doc"
import { extractFromDocx } from "./extract-from-docx"
import { extractFromPdf } from "./extract-from-pdf"

export const ExtractedDocument = async (filePath: string) => {
    const extension = filePath.split(".").pop()?.toLowerCase()
    try {
        switch (extension) {
            case "docx":
                logger.info(`File Type is doc`)
                return await extractFromDocx(filePath)
            case "doc":
                logger.info(`File Type is doc`)
                return await extractFromDoc(filePath)
            case "pdf":
                logger.info(`File Type is pdf`)
                return await extractFromPdf(filePath)
            case 'ppt':
                logger.info(`File Type is ppt`)
                break;
            default:
                logger.error(`Unsupported file type: ${extension}`)
                throw new AppError(`Unsupported file type: ${extension}`, 500)
        }
    } catch (error) {
        logger.error(`Failed to extract document content: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}