import winston from 'winston';
import path from 'path';

// Create directory for logs in production
const logDir = 'logs';

// Define levels and colors for the logger
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Add colors to winston
winston.addColors(colors);

// Define the format for the logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Define the transports for logs (console and files)
const transports = [
  // Console logs for all levels
  new winston.transports.Console(),

  // Error logs to file in production
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error'
  }),

  // All logs to file in production
  new winston.transports.File({
    filename: path.join(logDir, 'all.log')
  })
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports
});

export default logger;
