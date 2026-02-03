const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { query } = require("../db");
const { user: userQueries } = require("../db/queries");

const issueToken = (payload) => {
  if (!env.jwtSecret) {
    throw new Error("JWT secret not configured");
  }
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
};

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existing = await query(userQueries.selectIdByEmail, [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      userQueries.insertReturningPublic,
      [email, passwordHash, name]
    );

    const user = result.rows[0];
    const token = issueToken({ sub: user.id, email: user.email });
    return res.status(201).json({ user, token });
  } catch (err) {
    return res.status(500).json({ error: "Registration failed" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      userQueries.selectAuthByEmail,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = issueToken({ sub: user.id, email: user.email });
    return res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (err) {
    return res.status(500).json({ error: "Login failed" });
  }
};

module.exports = { register, login };
