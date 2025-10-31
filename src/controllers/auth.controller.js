import ms from 'ms';
import { accessTokenExpiry, refreshTokenExpiry } from '../config/env.config.js';
import { User } from '../models/index.js';
import { authService } from '../services/index.js';
import { clearRefreshCookie, setRefreshCookie } from '../utils/cookie.util.js';
import logger from '../utils/logger.util.js';
import { hashToken } from '../utils/token.util.js';
import authSchemas from '../validations/auth.validation.js';

export const register = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim();
    const name = String(req.body.name || '').trim();
    const password = req.body.password;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        message: 'Email already registered.',
      });
    }

    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      email,
      passwordHash,
      name,
    });

    const userObj = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    logger.info('User registered ', userObj);

    const { accessToken, refreshToken } = await authService.createTokens(user, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      accessToken,
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
    const password = req.body.password;
    const exists = await User.findOne({ email }).select('+passwordHash');

    if (!exists || !(await exists.comparePassword(password))) {
      return res.status(401).json({
        message: 'Invalid Credentails!!!',
      });
    }

    const userObj = {
      id: exists._id.toString(),
      name: exists.name,
      email: exists.email,
    };

    const { accessToken, refreshToken } = await authService.createTokens(
      exists,
      {
        ip: req?.ip,
        userAgent: req.get('User-Agent'),
      },
    );

    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      accessToken,
      expiresIn: ms(accessTokenExpiry) / 1000,
      tokenType: 'Bearer',
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

/** Refresh tokens */
export const refresh = async (req, res, next) => {
  try {
    const { error, value } = authSchemas.refreshTokenSchema.validate(
      req.cookies || {},
    );
    if (error) {
      return next(error);
    }
    const refreshToken = value.refreshToken;

    const tokens = await authService.rotateTokens(refreshToken, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    setRefreshCookie(res, tokens.refreshToken);
    return res.status(200).json({
      accessToken: tokens.accessToken,
      expiresIn: ms(accessTokenExpiry) / 1000,
      tokenType: 'Bearer',
      message: 'Token Refreshed Successfully ...',
    });
  } catch (error) {
    next(error);
  }
};

/** Logout from current session */
export const logout = async (req, res) => {
  try {
    const { error, value } = authSchemas.refreshTokenSchema.validate(
      req.cookies || {},
    );

    if (error) {
      throw error;
    }

    const refreshToken = value.refreshToken;

    const tokenHash = hashToken(refreshToken);

    const wasRevoked = await authService.revokeRefreshToken(tokenHash);

    if (wasRevoked) {
      logger.info(
        `Refresh token revoked successfully, token (prefix = ${tokenHash.slice(0, 8)})`,
      );
    } else {
      logger.error(
        `Attempt to revoke refresh token with invalid or already revoked refresh token, token (prefix = ${tokenHash.slice(0, 8)})`,
      );
    }

    /** Always clear cookie and respond with 200 ok status, even refresh token not found in db. */

    clearRefreshCookie(res);

    return res.status(200).json({
      message: 'Logout Successfully ...',
    });
  } catch (error) {
    /** Always clear cookie even if revokation fails */
    clearRefreshCookie(res);
    logger.error(`Error during logout`, { error: error.message });
    return res.status(500).json({
      error: error.message,
      message: 'Internal Server Error!!!',
    });
  }
};

/** Logout from all devices */
export const logoutAll = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const revokedCount = await authService.revokeAllRefreshTokens(userId);
    clearRefreshCookie(res);
    if (revokedCount) {
      logger.info(`Revoked ${revokedCount} refresh tokens for user: ${userId}`);
      return res.status(200).json({
        message: 'Logout from all devices ...',
      });
    }
    logger.info(`No active refresh tokens to revoke for user: ${userId} `);
    return res.status(200).json({
      message: 'No active session to logout from ...',
    });
  } catch (error) {
    clearRefreshCookie(res);
    next(error);
  }
};
