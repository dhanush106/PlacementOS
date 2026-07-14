import fs from 'fs';
import path from 'path';
import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

const isProduction = process.env.NODE_ENV === 'production';

winston.addColors(colors);

// Create the local logs directory only in development. Vercel serverless
// environments should never try to create or write project-local log files.
if (!isProduction && !fs.existsSync('logs')) {
  fs.mkdirSync('logs', { recursive: true });
}

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  isProduction ? winston.format.uncolorize() : winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

const transports = [
  new winston.transports.Console()
];

if (!isProduction) {
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({ filename: path.join('logs', 'combined.log') })
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
});

export default logger;
