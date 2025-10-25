import sanitize from 'sanitize-html';

import { refreshTokenExpiry } from '../config/env.config.js';
import { RefreshToken } from '../models/index.js';
import logger from '../utils/logger.util.js';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/token.util.js';
import ms from 'ms';

const safeUserAgent = (ua) => {
  if (!ua || typeof ua !== 'string') {
    return 'unknown';
  }

  return sanitize(ua, {
    allowedAttributes: [],
    allowedTags: [],
  }).slice(0, 255);
};

/**
 * Create a pair of access and refresh tokens, store refreshToken(hash) in persistance
 * @param {object} user - mongoose user document
 * @param {object} meta -  { ip, userAgent }
 * @returns {Promise<Object>}  - { accessToken, RefreshToken }
 */
export const createTokens = async (user, meta = {}) => {
  const accessToken = signAccessToken({
    email: user.email,
    sub: user._id.toString(),
  });
  const refreshToken = signRefreshToken({
    email: user.email,
    sub: user._id.toString(),
  });
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(ms(refreshTokenExpiry) + Date.now());
  const query = {
    tokenHash: refreshTokenHash,
    user: user._id,
    ip: typeof meta?.ip === 'string' ? meta.ip.slice(0, 45) : undefined,
    expiresAt,
    userAgent: safeUserAgent(meta?.userAgent),
  };
  await RefreshToken.create(query);
  return { accessToken, refreshToken };
};

/**
 * Rotate refresh token - called when refresh endpoint receive a refresh token
 * - verify refresh token
 * - find refresh token hash in db
 * - if not found means re-use -> security event
 *   -> revoke all refresh token for that user (global logout)
 * - if found but not active (revoked or expired) -> throw error
 * - if found and active -> revoke current refresh token
 * -  -> create pair of access and refresh token,
 * -  -> store replacedByHash (hash of new refresh token) in cuurent(old) refresh token
 * @param {string} presentedToken - refresh token
 * @param {object} meta           - { ip, req.userAgent }
 * @returns {Promise<Object>}     - { accessToken, RefreshToken }
 */
export const rotateTokens = async (refreshToken, meta = {}) => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    const err = new Error('Invalid Refresh Token');
    err.status = 401;
    err.cause = error.message;
    throw err;
  }
  const tokenHash = hashToken(refreshToken);
  const existing = await RefreshToken.findOne({ tokenHash }).populate('user');
  if (!existing) {
    logger.warn(`Refresh token re-use detected`, {
      sub: payload.sub,
      tokenHashPrefix: tokenHash.slice(0, 8),
    });
    if (payload?.sub) {
      await RefreshToken.updateMany(
        {
          user: payload.sub,
          revoked: null,
        },
        {
          $set: {
            revoked: new Date(),
          },
        },
      );
    }
    const err = new Error(
      'Refresh token re-use detected, all sessions revoked',
    );
    err.status = 401;
    throw err;
  }

  if (!existing.isActive) {
    const err = new Error('Refresh token not active');
    err.status = 401;
    throw err;
  }

  existing.revoked = new Date();
  const tokens = await createTokens(existing.user, meta);
  existing.replacedByHash = hashToken(tokens.refreshToken);
  await existing.save();
  return tokens;
};

/**
 * Revoked refresh token - called when user want to logout
 * @param {string} tokenHash - refresh token hash
 * @returns {Promise<boolean>} - was revoked or not
 */
export const revokeRefreshToken = async (tokenHash) => {
  const result = await RefreshToken.updateOne(
    {
      tokenHash,
      revoked: null,
    },
    {
      $set: {
        revoked: new Date(),
      },
    },
  );

  return result.modifiedCount === 1;
};

/**
 * Revoke all refresh token of current user - called for global logout (all devices)
 * @param {string} userId - monoose document user ID
 * @returns {Promise<number>} - revoked refresh tokens count
 */
export const revokeAllRefreshTokens = async (userId) => {
  const result = await RefreshToken.updateMany(
    {
      user: userId,
      revoked: null,
    },
    {
      $set: {
        revoked: new Date(),
      },
    },
  );
  return result.modifiedCount;
};
