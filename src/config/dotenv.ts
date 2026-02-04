import { configDotenv } from "dotenv";

configDotenv()

export const PORT = process.env.PORT
export const SUPABASE_PROJECT_API_URL = process.env.SUPABASE_PROJECT_API_URL
export const SUPABASE_PROJECT_API_KEY = process.env.SUPABASE_PROJECT_API_KEY
export const CLIENT_URL = process.env.CLIENT_URL
export const CONVERT_API_SECRET_SANDBOX = process.env.CONVERT_API_SECRET_SANDBOX
export const NODE_ENV = process.env.NODE_ENV