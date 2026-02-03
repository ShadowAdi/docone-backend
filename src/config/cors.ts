import cors from "cors";
import { Express } from "express";
import { CLIENT_URL } from "./dotenv";
import { logger } from "./logger";


export const CorsConfig = (app: Express) => {
  try {
    app.use(
      cors({
        origin: CLIENT_URL,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials:true
      })
    );
  } catch (error) {
    console.error("CORS config failed: ", error);
    logger.error(`CORS config failed: ${error}`)
  }
};