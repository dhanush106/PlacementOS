import fs from "fs";
import path from "path";
import winston from "winston";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Detect serverless environments
const isServerless =
  !!process.env.VERCEL ||
  !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
  !!process.env.RENDER ||
  !!process.env.RAILWAY_ENVIRONMENT;

const isDevelopment = process.env.NODE_ENV !== "production";

// Create logs directory only for local development
if (!isServerless) {
  try {
    const logsDir = path.resolve(process.cwd(), "logs");

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  } catch (err) {
    console.warn("⚠️ Unable to create logs directory:", err.message);
  }
}

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  isDevelopment
    ? winston.format.colorize({ all: true })
    : winston.format.uncolorize(),
  winston.format.printf(
    ({ timestamp, level, message }) =>
      `${timestamp} ${level}: ${message}`
  )
);

const transports = [
  new winston.transports.Console({
    handleExceptions: true,
  }),
];

// File logging only on local machine
if (!isServerless) {
  const logsDir = path.resolve(process.cwd(), "logs");

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      handleExceptions: true,
    })
  );

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
    })
  );
}

const logger = winston.createLogger({
  levels,
  level: isDevelopment ? "debug" : "info",
  format: logFormat,
  transports,
  exitOnError: false,
});

export default logger;