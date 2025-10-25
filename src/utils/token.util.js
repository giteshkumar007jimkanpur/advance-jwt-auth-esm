import crypto from 'crypto';

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import {
  accessTokenExpiry,
  accessTokenSecret,
  jwtAudience,
  jwtIssuer,
  refreshTokenExpiry,
  refreshTokenSecret,
} from '../config/env.config.js';

export const signAccessToken = (payload = {}) => {
  const iat = Math.floor(Date.now() / 1000);
  const jti = uuidv4(); /** unique token id for future blocklist */
  const opts = {
    algorithm: 'HS256',
    expiresIn: accessTokenExpiry,
    issuer: jwtIssuer,
    audience: jwtAudience,
  };
  return jwt.sign(
    {
      ...payload,
      iat,
      jti,
      typ: 'access',
    },
    accessTokenSecret,
    opts,
  );
};

export const signRefreshToken = (payload = {}) => {
  const iat = Math.floor(Date.now() / 1000);
  const jti = uuidv4();
  const opts = {
    algorithm: 'HS256',
    expiresIn: refreshTokenExpiry,
    issuer: jwtIssuer,
    audience: jwtAudience,
  };
  return jwt.sign(
    {
      ...payload,
      iat,
      jti,
      typ: 'refresh',
    },
    refreshTokenSecret,
    opts,
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, accessTokenSecret, {
    algorithms: ['HS256'],
    issuer: jwtIssuer,
    audience: jwtAudience,
  });
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, refreshTokenSecret, {
    algorithms: ['HS256'],
    issuer: jwtIssuer,
    audience: jwtAudience,
  });
};

export const hashToken = (token) => {
  return crypto.createHash('SHA256').update(token).digest('hex');
};
