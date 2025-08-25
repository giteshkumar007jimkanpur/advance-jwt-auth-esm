import { isProd } from '../config/secret-keys.js';
import logger from '../utils/logger.js';
const errorHandler = (err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const isValidationError = err.isJoi && err.details;

  // Build base payload
  const payload = {
    message: isValidationError
      ? 'Request Validation Error'
      : err.publicMessage || err.message || 'Internal Server Error',
    status,
  };

  if (isValidationError) {
    payload.details = err.details.map((d) => d.message);
  }

  if (!isProd && err.stack) {
    payload.stack = err.stack;
  }

  // Winston-native: pass one object, no duplication
  logger.error({
    ...payload,
  });
  res.status(status).json(payload);
};

export default errorHandler;
