const bcrypt = require("bcryptjs");
const { query } = require("../db");
const { user: userQueries } = require("../db/queries");

// Returns the authenticated user's profile.
// Requires `requireAuth` middleware (sets `req.user` from the JWT payload).
const me = async (req, res) => {
  try {
    const userId = req.user && req.user.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await query(userQueries.selectPublicById, [userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load user" });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, name } = req.body || {};

    if (!email || !password || !name) {
      return res.status(400).json({ error: "email, password, and name are required" });
    }

    const existing = await query(userQueries.selectIdByEmail, [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      userQueries.insertReturningPublic,
      [email, passwordHash, name]
    );

    return res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create user" });
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!id) {
      return res.status(400).json({ error: "Missing user id" });
    }

    const result = await query(userQueries.selectPublicById, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load user" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!id) {
      return res.status(400).json({ error: "Missing user id" });
    }

    const { email, name, password } = req.body || {};
    const hasAnyField = email !== undefined || name !== undefined || password !== undefined;
    if (!hasAnyField) {
      return res.status(400).json({ error: "No fields to update" });
    }

    if (email !== undefined) {
      if (!email) {
        return res.status(400).json({ error: "email cannot be empty" });
      }

      const existing = await query(userQueries.selectIdByEmailExcludingId, [email, id]);
      if (existing.rowCount > 0) {
        return res.status(409).json({ error: "Email already in use" });
      }
    }

    if (name !== undefined) {
      if (!name) {
        return res.status(400).json({ error: "name cannot be empty" });
      }
    }

    let passwordHash = null;
    if (password !== undefined) {
      if (!password || String(password).length < 8) {
        return res.status(400).json({ error: "password must be at least 8 characters" });
      }

      passwordHash = await bcrypt.hash(password, 12);
    }

    const result = await query(
      userQueries.byIdReturningPublic,
      [email === undefined ? null : email, name === undefined ? null : name, passwordHash, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update user" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!id) {
      return res.status(400).json({ error: "Missing user id" });
    }

    const result = await query(userQueries.byIdReturningId, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete user" });
  }
};

module.exports = { me, createUser, getUser, updateUser, deleteUser };
