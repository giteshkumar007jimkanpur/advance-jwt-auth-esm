import ms from 'ms';
import sanitize from 'sanitize-html';

import { refreshTokenExpiry } from '../config/secret-keys.js';
import { RefreshToken } from '../models/index.js';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import logger from '../utils/logger.js';

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
 * Create a pair of access and refresh token, store refreshToken(hash) in persistance
 * @param {object} user - mongoose user document
 * @param {object} meta -  { ip, userAgent }
 * @returns
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
  const expiresIn = refreshTokenExpiry;
  const msIn = ms(expiresIn);
  const expiresAt = new Date(msIn + Date.now());
  const query = {
    expiresAt,
    ip: typeof meta?.ip === 'string' ? meta?.ip.slice(0, 45) : undefined,
    tokenHash: refreshTokenHash,
    user: user._id,
    userAgent: safeUserAgent(meta?.userAgent),
  };
  await RefreshToken.create(query);
  return { accessToken, refreshToken };
};

/**
 * Rotate refresh token - called when refresh endpoint receive a refresh token
 * - verify refresh token
 * - find refresh token hash in db
 * - if not found means reuse -> security event
 *   -> revoke all refresh token for that user (global logout)
 * - if found but not active (revoked or expired) -> throw error
 * - if found and active -> revoke current refresh token
 * -  -> create pair of access and refresh token,
 * -  -> store replacedByHash (hash of new refresh token) in cuurent(old) refresh token
 * @param {string} presentedToken - refresh token
 * @param {object} meta           - { ip, req.userAgent }
 */
export const rotateRefreshToken = async (presentedToken, meta = {}) => {
  let payload;
  try {
    payload = verifyRefreshToken(presentedToken);
  } catch (error) {
    const err = new Error('Invalid refresh token');
    err.status = 401;
    err.cause = error.message;
    throw err;
  }

  const tokenHash = hashToken(presentedToken);

  const existing = await RefreshToken.findOne({ tokenHash }).populate('user');

  if (!existing) {
    logger.warn(`Refresh token use detected`, {
      sub: payload?.sub,
      tokenHashPrefix: tokenHash.slice(0, 8),
    });
    if (payload?.sub) {
      const filter = {
        revoked: null,
        user: payload.sub,
      };
      await RefreshToken.updateMany(filter, {
        $set: {
          revoked: new Date(),
        },
      });
    }

    const err = new Error('Refresh token reuse detected, all sessions revoked');
    err.status = 401;
    throw err;
  }

  /**
   * Refresh token found in DB, but it is not active (expired or revoked)
   * Then throw error
   * No need for global logout -> Too aggressive
   */
  if (!existing.isActive) {
    const err = new Error('Refresh token not active');
    err.status = 401;
    throw err;
  }

  existing.revoked = new Date();

  const { accessToken, refreshToken } = await createTokens(existing.user, meta);

  existing.replacedByHash = hashToken(refreshToken);
  await existing.save();

  return { accessToken, refreshToken };
};

/**
 * Revoked refresh token - called when user want to logout
 * @param {string} tokenHash - refresh token hash
 * @returns {Promise<boolean>} - was revoked or not
 */
export const revokeRefreshToken = async (tokenHash) => {
  const result = await RefreshToken.updateOne(
    {
      revoked: null,
      tokenHash,
    },
    {
      $set: { revoked: new Date() },
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
      revoked: null,
      user: userId,
    },
    {
      $set: {
        revoked: new Date(),
      },
    },
  );
  return result.modifiedCount;
};
