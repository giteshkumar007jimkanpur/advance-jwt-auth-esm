// Centralized env loader with required, default and optional values.

import dotenv from 'dotenv';
import Joi from 'joi';
dotenv.config();

const envSchema = Joi.object({
  ACCESS_TOKEN_EXPIRY: Joi.string().default('15m'),
  ACCESS_TOKEN_SECRET: Joi.string().required(),

  JWT_AUDIENCE: Joi.string().default('advance-jwt-auth'),

  JWT_ISSUER: Joi.string().default('advance-jwt-auth-client'),
  MONGO_URI: Joi.string().uri().required(),

  NODE_ENV: Joi.string()
    .valid('production', 'development', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  REFRESH_TOKEN_EXPIRY: Joi.string().default('7d'),
  REFRESH_TOKEN_SECRET: Joi.string().required(),
}).unknown(); // allow unknown vars

const { error, value: envVars } = envSchema.validate(process.env, {
  abortEarly: false,
  allowUnknown: true,
  stripUnknown: true,
});

if (error) {
  throw new Error(`❌ Env validation error: ${error.message}`);
}
export const isProd = process.env.NODE_ENV === 'production';

const secretMin = isProd ? 64 : 32;

Joi.assert(envVars.ACCESS_TOKEN_SECRET, Joi.string().min(secretMin));
Joi.assert(envVars.REFRESH_TOKEN_SECRET, Joi.string().min(secretMin));

// Named exports
export const accessTokenExpiry = envVars.ACCESS_TOKEN_EXPIRY;
export const accessTokenSecret = envVars.ACCESS_TOKEN_SECRET;
export const audience = envVars.JWT_AUDIENCE;
export const issuer = envVars.JWT_ISSUER;
export const mongoUri = envVars.MONGO_URI;
export const port = envVars.PORT;
export const refreshTokenExpiry = envVars.REFRESH_TOKEN_EXPIRY;
export const refreshTokenSecret = envVars.REFRESH_TOKEN_SECRET;
