/**
 * Middleware to validate request body
 */
import logger from '../utils/logger.util.js';

const validateRequest = (schema) => (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    const message = 'Request body must be a valid JSON object.';
    logger.error(message);
    return res.status(400).json({ message });
  }

  const { error, value } = schema.validate(req.body, {
    allowUnknown: true,
    stripUnknown: true,
    abortEarly: false,
  });

  if (error) {
    return next(error);
  }

  req.body = value; /** No unwanted fiels or unwanted value leaks to the app */

  next();
};

export default validateRequest;
