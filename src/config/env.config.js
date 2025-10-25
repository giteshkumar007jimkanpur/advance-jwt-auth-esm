import 'dotenv/config';
import Joi from 'joi';

const envSchema = Joi.object({
  PORT: Joi.number().default(3000),
  MONGO_URI: Joi.string().uri().required(),

  ACCESS_TOKEN_SECRET: Joi.string().required(),
  REFRESH_TOKEN_SECRET: Joi.string().required(),

  ACCESS_TOKEN_EXPIRY: Joi.string().default('15m'),
  REFRESH_TOKEN_EXPIRY: Joi.string().default('7d'),

  JWT_ISSUER: Joi.string().default('myapp-jwt-auth'),
  JWT_AUDIENCE: Joi.string().default('myapp-jwt-auth-client'),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env, {
  allowUnknown: true,
  stripUnknown: true,
  abortEarly: false,
});

if (error) {
  throw new Error(`❌ Env validation error: ${error.message}`);
}

export const isProd = process.env.NODE_ENV === 'production';

const secretMin = isProd ? 64 : 32;

Joi.assert(envVars.ACCESS_TOKEN_SECRET, Joi.string().min(secretMin));
Joi.assert(envVars.REFRESH_TOKEN_SECRET, Joi.string().min(secretMin));

export const port = envVars.PORT;
export const mongoUri = envVars.MONGO_URI;

export const accessTokenSecret = envVars.ACCESS_TOKEN_SECRET;
export const accessTokenExpiry = envVars.ACCESS_TOKEN_EXPIRY;

export const refreshTokenSecret = envVars.REFRESH_TOKEN_SECRET;
export const refreshTokenExpiry = envVars.REFRESH_TOKEN_EXPIRY;

export const jwtIssuer = envVars.JWT_ISSUER;
export const jwtAudience = envVars.JWT_AUDIENCE;
