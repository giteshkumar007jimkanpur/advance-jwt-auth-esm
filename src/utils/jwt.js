import crypto from 'crypto';

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import {
  accessTokenSecret,
  accessTokenExpiry,
  refreshTokenSecret,
  refreshTokenExpiry,
  issuer,
  audience,
} from '../config/secret-keys.js';

const signAccessToken = (payload = {}) => {
  const jti = uuidv4(); // useful token id (useful for future blocklist)
  const now = Math.floor(Date.now() / 1000);
  const opts = {
    algorithm: 'HS256',
    audience,
    expiresIn: accessTokenExpiry,
    issuer,
  };
  return jwt.sign(
    { ...payload, iat: now, jti, typ: 'access' },
    accessTokenSecret,
    opts,
  );
};

const signRefreshToken = (payload = {}) => {
  const jti = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  const opts = {
    algorithm: 'HS256',
    audience,
    expiresIn: refreshTokenExpiry,
    issuer,
  };
  return jwt.sign(
    { ...payload, iat: now, jti, typ: 'refresh' },
    refreshTokenSecret,
    opts,
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, accessTokenSecret, {
    algorithms: ['HS256'],
    audience,
    issuer,
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, refreshTokenSecret, {
    algorithms: ['HS256'],
    audience,
    issuer,
  });
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
};
