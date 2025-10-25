import ms from 'ms';

import { isProd, refreshTokenExpiry } from '../config/env.config.js';

const cookieOpts = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'strict' : 'lax',
};

export const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    ...cookieOpts,
    maxAge: ms(refreshTokenExpiry),
  });
};

export const clearRefreshCookie = (res) => {
  res.cookie('refreshToken', '', {
    ...cookieOpts,
    expires: new Date(0) /** past date to force expire */,
  });
};
