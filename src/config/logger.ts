import winston from "winston";
import path from "path";
import fs from "fs";
import { format, transports, createLogger } from "winston";
const { combine, timestamp, printf, colorize } = format;

const logDir = path.join(__dirname, "../../logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

export const logger = winston.createLogger({
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
  transports: [
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),
    new transports.File({
      filename: path.join(logDir, "warn.log"),
      level: "warn",
    }),
    new transports.File({
      filename: path.join(logDir, "info.log"),
      level: "info",
    }),
    new transports.Console({
      format: combine(colorize(), timestamp(), logFormat),
    }),
  ],
});