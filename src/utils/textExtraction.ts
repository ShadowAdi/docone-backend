import { logger } from "../config/logger"
import { AppError } from "./AppError"

export const TextExtraction=async ()=>{
    try {
        
    } catch (error) {
        logger.error(`Failed To Extract Text from the document ${error}`)
        console.error(`Failed To Extract Text from the document ${error}`)
        throw new AppError(`Failed to Extract Text from the document: ${error}`,500)
    }
}