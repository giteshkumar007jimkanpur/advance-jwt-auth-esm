/**
 * Middleware to validate req.body
 */

const validateRequest = (schema) => (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      message: 'Request Body must be a valid JSON object.',
    });
  }

  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return next(error);
  }

  req.body =
    value; /** No unwanted fields or unwanted value leak into your app. */
  next();
};

export default validateRequest;
