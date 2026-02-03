const Joi = require("joi");
const {user} = require('../db/queries')
const email = Joi.string().email().max(255).required();
const password = Joi.string().min(8).max(128).required();
const name = Joi.string().min(2).max(80).required();

const user_email = user.selectAuthByEmail

if (user_email) {
    throw new Error(`${user_email} is already in use`);
}

const registerSchema = Joi.object({
    email: email,
    password,
    name
});

const loginSchema = Joi.object({
    email: email,
    password
});

module.exports = {registerSchema, loginSchema};
