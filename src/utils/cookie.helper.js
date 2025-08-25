import ms from 'ms';

import { isProd, refreshTokenExpiry } from '../config/secret-keys.js';

export const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    maxAge: ms(refreshTokenExpiry) / 1000,
    sameSite: 'strict',
    secure: isProd,
  });
};

export const clearRefreshCookie = (res) => {
  res.cookie('refreshToken', {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProd,
  });
};
