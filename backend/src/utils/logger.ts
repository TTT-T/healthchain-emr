import winston from 'winston';
import config from '../config/index';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = config.server.nodeEnv || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different log formats
const format = winston.format.combine(
  // Add timestamp to logs
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  // Tell Winston that the logs must be colored
  winston.format.colorize({ all: true }),
  // Define the format of the message showing the timestamp, the level and the message
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define which transports the logger must use to print out messages
const transports = [
  // Allow the use the console to print the messages
  new winston.transports.Console(),
  // Allow to print all the error level messages inside the error.log file
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  // Allow to print all the error message inside the all.log file
  new winston.transports.File({ filename: 'logs/all.log' }),
];

// Create the logger instance that has to be exported
// and used to log messages
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export { logger };
