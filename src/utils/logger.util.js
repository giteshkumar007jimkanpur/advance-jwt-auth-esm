import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { v4 as uuidv4 } from 'uuid';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import requestContext from './request.context.util.js';
import { isProd } from '../config/env.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** ensure logs directory exists */
const logDir = path.join(__dirname, '../../logs');
if (isProd && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/** Global startup ID for logs output requests */
const startupId = uuidv4();

/** Add request ID automatically if available */
const addRequestId = format((info) => {
  const ctx = requestContext.getContext();
  info.requestId = ctx?.requestId || info.requestId || startupId;
  return info;
});

const customJsonFormatter = format.printf((info) => {
  const ordered = {
    timestamp: info.timestamp,
    level: info.level,
    message: info.message,
    requestId: info.requestId,
  };

  info.status !== undefined && (ordered.status = info.status);

  info.details !== undefined && (ordered.details = info.details);

  info.stack !== undefined && (ordered.stack = info.stack);

  Object.keys(info).forEach((key) => {
    if (!ordered.hasOwnProperty(key)) {
      ordered[key] = info[key];
    }
  });

  return JSON.stringify(ordered);
});

const logger = createLogger({
  level: isProd ? 'http' : 'debug',
  transports: isProd
    ? [
        new transports.Console(),
        new DailyRotateFile({
          datePattern: 'YYYY-MM-DD',
          dirname: logDir,
          level: 'error',
          filename: 'error-%DATE%.log',
          maxFiles: '14d',
          zippedArchive: true,
        }),
        new DailyRotateFile({
          datePattern: 'YYYY-MM-DD',
          dirname: logDir,
          filename: 'combined-%DATE%.log',
          maxFiles: '14d',
          zippedArchive: true,
        }),
      ]
    : [new transports.Console()],
  format: isProd
    ? format.combine(
        addRequestId(),
        format.timestamp(),
        format.errors({ stack: true }),
        customJsonFormatter,
      )
    : format.combine(
        addRequestId(),
        format.colorize(),
        format.timestamp(),
        format.printf(({ level, message, requestId, timestamp, ...rest }) => {
          const { details, stack, status, ...otherProps } = rest;
          let output = `[${timestamp}] ${level}: ${message}`;
          if (requestId) {
            output += ` (requestId = ${requestId})`;
          }
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
});

logger.http = (msg) => logger.log({ level: 'http', message: msg });

export default logger;
