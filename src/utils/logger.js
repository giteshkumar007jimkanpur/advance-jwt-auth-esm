/**
 * Winston logger with JSON in prod and pretty output in dev
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { v4 as uuidv4 } from 'uuid';
import { createLogger, transports, format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { isProd } from '../config/secret-keys.js';
import requestContextHelper from '../utils/request.context.helper.js';

/** Ensure log directory exists */
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/** Global startupId for log outside requests */
const startupId = uuidv4();

/** Add requestId automatically if available */
const addRequestId = format((info) => {
  const ctx = requestContextHelper.getContext();
  info.requestId = ctx?.requestId || info.requestId || startupId;
  return info;
});

/** Custom JSON formatter with property order control */
const customJsonFormat = format.printf((info) => {
  const ordered = {
    level: info.level,
    message: info.message,
    requestId: info.requestId,
    timestamp: info.timestamp,
  };

  // Then technical details
  if (info.status !== undefined) {
    ordered.status = info.status;
  }
  if (info.details) {
    ordered.details = info.details;
  }
  if (info.stack) {
    ordered.stack = info.stack;
  }

  // Add any other properties
  Object.keys(info).forEach((key) => {
    if (!ordered.hasOwnProperty(key)) {
      ordered[key] = info[key];
    }
  });

  return JSON.stringify(ordered);
});

const logger = createLogger({
  format: isProd
    ? format.combine(
        addRequestId(),
        format.timestamp(),
        format.errors({ stack: true }),
        customJsonFormat,
      )
    : format.combine(
        addRequestId(),
        format.colorize(),
        format.timestamp(),
        format.printf(({ level, message, requestId, timestamp, ...rest }) => {
          const { details, stack, status, ...otherProps } = rest;

          let output = `[${timestamp}] ${level}: ${message}`;

          // Add requestId in parentheses
          if (requestId) {
            output += ` (requestId=${requestId})`;
          }

          // Then additional context with pipe separators
          const extras = [];
          if (status) {
            extras.push(`status=${status}`);
          }
          if (details && Array.isArray(details)) {
            const quoted = details.map((d) => `"${d}"`).join(', ');
            extras.push(`details=[${quoted}]`);
          }
          if (Object.keys(otherProps).length > 0) {
            extras.push(JSON.stringify(otherProps));
          }

          // Add stack to extras if it exists (for consistent pipe separation)
          if (stack && level.includes('error')) {
            extras.push(`Stack: ${stack}`);
          }

          if (extras.length > 0) {
            output += ` | ${extras.join(' | ')}`;
          }

          return output;
        }),
      ),
  level: isProd ? 'http' : 'debug',
  transports: isProd
    ? [
        new transports.Console(),
        // error logs with rotation
        new DailyRotateFile({
          datePattern: 'YYYY-MM-DD',
          dirname: logDir,
          filename: 'error-%DATE%.log',
          level: 'error',
          maxFiles: '14d', // keep 14 days
          zippedArchive: true,
        }),

        // combined logs with rotation
        new DailyRotateFile({
          datePattern: 'YYYY-MM-DD',
          dirname: logDir,
          filename: 'combined-%DATE%.log',
          maxFiles: '14d',
          zippedArchive: true,
        }),
      ]
    : [new transports.Console()],
});

/** optional http level for morgan stream */
logger.http = (msg) => logger.log({ level: 'http', message: msg });

export default logger;
