/**
 * Middleware to authenticate user request
 */
import logger from '../utils/logger.util.js';
import { verifyAccessToken } from '../utils/token.util.js';

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader?.startsWith('Bearer')) {
      logger.warn('Access token missing or malformed');
      return res.status(401).json({
        message: 'Access token missing or malformed',
      });
    }
    const accessToken = authHeader.split(' ')[1];
    const payload = verifyAccessToken(accessToken);
    req.user = {
      id: payload.sub,
      email: payload.email,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Access Token Expired', { error: error.message });
      return res.status(401).json({
        message: 'Access Token Expired',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid Access Token', { error: error.message });
      return res.status(401).json({
        message: 'Invalid Access Token',
      });
    }
    next(error);
  }
};

export default authenticate;
