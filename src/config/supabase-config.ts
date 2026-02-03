import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PROJECT_API_KEY, SUPABASE_PROJECT_API_URL } from "./dotenv";
import { logger } from "./logger";
import "./dotenv"
import { AppError } from "../utils/AppError";

if (!SUPABASE_PROJECT_API_URL || !SUPABASE_PROJECT_API_KEY) {
    logger.error(`Failed to get Supabase url: ${SUPABASE_PROJECT_API_URL} or Failed to get Key: ${SUPABASE_PROJECT_API_KEY}`)
    console.error(`Failed to get Supabase url: ${SUPABASE_PROJECT_API_URL} or Failed to get Key: ${SUPABASE_PROJECT_API_KEY}`)
    throw new AppError(`Internal Server Error`,500)
}

export const supabase=createClient(
    SUPABASE_PROJECT_API_URL!,
    SUPABASE_PROJECT_API_KEY!
)