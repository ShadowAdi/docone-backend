import { logger } from "../config/logger"
import { AppError } from "./AppError"

export const TextExtraction=async (filePath:string)=>{
    try {
        logger.info(`The Path of the file is: ${filePath}`)
        console.info(`The Path of the file is: ${filePath}`)
    } catch (error) {
        logger.error(`Failed To Extract Text from the document ${error}`)
        console.error(`Failed To Extract Text from the document ${error}`)
        throw new AppError(`Failed to Extract Text from the document: ${error}`,500)
    }
}