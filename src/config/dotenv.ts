import { configDotenv } from "dotenv";

configDotenv()

export const PORT = process.env.PORT
export const DB_URL = process.env.DB_URL
export const CLIENT_URL = process.env.CLIENT_URL
export const NODE_ENV = process.env.NODE_ENV