const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  if (!env.jwtSecret) {
    return res.status(500).json({ error: "JWT secret not configured" });
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = { requireAuth };
