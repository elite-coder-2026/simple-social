const Joi = require("joi");

const positiveInt = Joi.number().integer().min(1);

const userIdParamsSchema = Joi.object({
  userId: positiveInt.required()
});

const listSubscriptionsQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

module.exports = { userIdParamsSchema, listSubscriptionsQuerySchema };

