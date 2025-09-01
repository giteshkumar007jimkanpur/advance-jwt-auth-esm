import ms from 'ms';

import { isProd, refreshTokenExpiry } from '../config/secret-keys.js';

export const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    maxAge: ms(refreshTokenExpiry),
    sameSite: isProd ? 'strict' : 'lax',
    secure: isProd,
  });
};

export const clearRefreshCookie = (res) => {
  res.cookie('refreshToken', '', {
    expires: new Date(0),
    httpOnly: true, // past date to force expire
    sameSite: isProd ? 'strict' : 'lax',
    secure: isProd,
  });
};
