const Joi = require("joi");

const positiveInt = Joi.number().integer().min(1);

const createRequestSchema = Joi.object({
  recipientId: positiveInt.required()
});

const relationIdParamsSchema = Joi.object({
  id: positiveInt.required()
});

const friendUserIdParamsSchema = Joi.object({
  userId: positiveInt.required()
});

module.exports = {
  createRequestSchema,
  relationIdParamsSchema,
  friendUserIdParamsSchema
};

