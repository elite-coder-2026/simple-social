const express = require("express");
const { register, login } = require("../controllers/auth.controller");
const { validateBody } = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validation/auth");

const router = express.Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);

module.exports = router;
