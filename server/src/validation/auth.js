const Joi = require("joi");
const email = Joi.string().trim().email().max(255).required();
const password = Joi.string().min(8).max(128).required();
const name = Joi.string().trim().min(2).max(80).required();

const registerSchema = Joi.object({
  email,
  password,
  name
});

const loginSchema = Joi.object({
  email,
  password
});

module.exports = { registerSchema, loginSchema };
