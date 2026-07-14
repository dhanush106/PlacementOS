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

const isDevelopment = process.env.NODE_ENV !== "production";

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

const logger = winston.createLogger({
  levels,
  level: isDevelopment ? "debug" : "info",
  format: logFormat,
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
    }),
  ],
  exitOnError: false,
});

export default logger;
