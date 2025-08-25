import ms from 'ms';

import { accessTokenExpiry } from '../config/secret-keys.js';
import { User } from '../models/index.js';
import { authService } from '../services/index.js';
import {
  setRefreshCookie,
  clearRefreshCookie,
} from '../utils/cookie.helper.js';
import { hashToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';
import authValidation from '../validations/auth.validation.js';

export const register = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim();
    const name = String(req.body.name || '').trim();
    const password = String(req.body.password || '');

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        message: 'Email already registered.',
      });
    }

    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      email,
      name,
      passwordHash,
    });
    const userObj = {
      email: user.email,
      id: user._id,
      name: user.name,
    };
    logger.info('User registered', userObj);
    const tokens = await authService.createTokens(user, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    setRefreshCookie(res, tokens.refreshToken);

    return res.status(201).json({
      accessToken: tokens.accessToken,
      expiresIn: ms(accessTokenExpiry) / 1000,
      tokenType: 'Bearer',
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};
export const login = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');

    const exists = await User.findOne({ email }).select('+passwordHash');
    if (!exists || !(await exists.comparePassword(password))) {
      return res.status(401).json({
        message: 'Invalid Credentails!!!',
      });
    }

    const tokens = await authService.createTokens(exists, {
      ip: req?.ip,
      userAgent: req.get('User-Agent'),
    });

    setRefreshCookie(res, tokens.refreshToken);

    const userObj = {
      email: exists.email,
      id: exists._id,
      name: exists.name,
    };
    return res.status(200).json({
      accessToken: tokens.accessToken,
      expiresIn: ms(accessTokenExpiry) / 1000,
      tokenType: 'Bearer',
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { error, value } = authValidation.refreshTokenCookieSchema.validate(
      req.cookies || {},
    );
    if (error) {
      return next(error);
    }
    const refreshToken = value.refreshToken;

    const tokens = await authService.rotateRefreshToken(refreshToken, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    setRefreshCookie(res, tokens.refreshToken);
    return res.status(200).json({
      accessToken: tokens.accessToken,
      expiresIn: ms(accessTokenExpiry) / 1000,
      message: 'Tokens refreshed successfully...',
      tokenType: 'Bearer',
    });
  } catch (error) {
    clearRefreshCookie(res);
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { error, value } = authValidation.refreshTokenCookieSchema.validate(
      req.cookies || {},
    );

    if (error) {
      return next(error);
    }
    const refreshToken = value.refreshToken;

    const tokenHash = hashToken(refreshToken);

    const wasRevoked = await authService.revokeRefreshToken(tokenHash);

    if (wasRevoked) {
      logger.info(
        `Refresh token revoked successfully, token (hash= ${tokenHash.slice(0, 8)})`,
      );
    } else {
      logger.error(
        `Attempt to revoke with invalid or already revoked refresh token (hash= ${tokenHash.slice(0, 8)})`,
      );
    }

    clearRefreshCookie(res);

    /** Always respond with status 200 ok even token was not found in db */
    return res.status(200).json({
      message: 'Logout Successfully...',
    });
  } catch (error) {
    /** Always clear cookir even if revokation fails */
    clearRefreshCookie(res);
    logger.error('Error during logout', { error: error.message });
    return res.status(500).json({
      error: error.message,
      message: 'Internal Server Error !',
    });
  }
};

/** Logout from all devices */
export const logoutAll = async (req, res, next) => {
  try {
    const userId = req.user.id.toString();
    const revokedCount = await authService.revokeAllRefreshTokens(userId);
    clearRefreshCookie(res);
    if (revokedCount) {
      logger.info(`Revoked ${revokedCount} refresh tokens for user: ${userId}`);
      return res.status(200).json({
        message: 'Logged out from all devices',
      });
    }
    logger.info(`No active refresh tokens to revoke for user: ${userId}`);
    return res.status(200).json({
      message: 'No active session to logout from',
    });
  } catch (error) {
    clearRefreshCookie(res);
    next(error);
  }
};
