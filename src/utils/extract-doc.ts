import { logger } from "../config/logger"
import { AppError } from "./AppError"
import { extractFromDocx } from "./extract-from-docx"

export const ExtractedDocument = async (filePath: string) => {
    const extension = filePath.split(".").pop()?.toLowerCase()
    try {
        switch (extension) {
            case "docx":
                logger.info(`File Type is doc`)
                return await extractFromDocx(filePath)
            case "ppt":
                logger.info(`File Type is ppt`)
                break;
            case 'pdf':
                logger.info(`File Type is pdf`)
                break;
            default:
                logger.error(`Unsupported file type: ${extension}`)
                throw new AppError(`Unsupported file type: ${extension}`, 500)
        }
    } catch (error) {
        logger.error(`Failed to extract text from the doc: ${error}`)
        console.error(`Failed to extract text from the doc: ${error}`)
        throw new AppError(`Failed to extract text from the doc: ${error}`, 500)
    }
}