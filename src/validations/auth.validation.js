import Joi from 'joi';

const passwordRules = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[a-z]/, 'lowercase')
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/\d/, 'digit')
  .pattern(/[^A-Za-z0-9]/, 'symbol')
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',

    // Joi will inject the pattern name (lowercase/uppercase/digit/symbol)
    'string.pattern.name': 'Password must include at least one {#name}',
  });

const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: passwordRules,
  confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
    'any.only': 'Confirm password must match password',
  }),
  name: Joi.string().allow('').optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token missing in cookies',
    'string.empty': 'Refresh token can not be empty',
  }),
}).unknown();

export default { loginSchema, registerSchema, refreshTokenSchema };
