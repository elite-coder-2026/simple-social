const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    convert: true,
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.details.map((d) => d.message)
    });
  }

  req.body = value;
  return next();
};

const validateParams = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.params, {
    abortEarly: false,
    convert: true,
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.details.map((d) => d.message)
    });
  }

  req.params = value;
  return next();
};

const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    convert: true,
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.details.map((d) => d.message)
    });
  }

  req.query = value;
  return next();
};

module.exports = { validateBody, validateParams, validateQuery };
