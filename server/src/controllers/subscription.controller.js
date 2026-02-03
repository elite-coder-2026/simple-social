const { query } = require("../db");
const { subscriptions: subscription_queries } = require("../db/queries");

const subscribe = async (req, res) => {
  try {
    const me = req.me;
    const targetUserId = Number(req.params && req.params.userId);

    if (!me) return res.status(401).json({ error: "Unauthorized" });
    if (!targetUserId) return res.status(400).json({ error: "Invalid user id" });
    if (targetUserId === me) return res.status(400).json({ error: "Cannot subscribe to yourself" });

    const target = await query(subscription_queries.selectTargetById, [targetUserId]);
    if (target.rowCount === 0) return res.status(404).json({ error: "User not found" });

    const result = await query(subscription_queries.upsertReturningSubscription, [me, targetUserId]);
    return res.status(201).json({ subscription: result.rows[0], user: target.rows[0] });
  } catch (err) {
    console.error("subscribe failed", err);
    return res.status(500).json({ error: "Failed to subscribe" });
  }
};

const unsubscribe = async (req, res) => {
  try {
    const me = req.me;
    const targetUserId = Number(req.params && req.params.userId);

    if (!me) return res.status(401).json({ error: "Unauthorized" });
    if (!targetUserId) return res.status(400).json({ error: "Invalid user id" });

    const result = await query(subscription_queries.deactivateByPairReturningId, [me, targetUserId]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Subscription not found" });

    return res.status(204).send();
  } catch (err) {
    console.error("unsubscribe failed", err);
    return res.status(500).json({ error: "Failed to unsubscribe" });
  }
};

const getStatus = async (req, res) => {
  try {
    const me = req.me;
    const targetUserId = Number(req.params && req.params.userId);

    if (!me) return res.status(401).json({ error: "Unauthorized" });
    if (!targetUserId) return res.status(400).json({ error: "Invalid user id" });

    const result = await query(subscription_queries.selectByPair, [me, targetUserId]);
    if (result.rowCount === 0) return res.json({ subscribed: false });

    const row = result.rows[0];
    return res.json({ subscribed: row.deleted_at == null, subscription: row });
  } catch (err) {
    console.error("getStatus failed", err);
    return res.status(500).json({ error: "Failed to load subscription" });
  }
};

const listFollowing = async (req, res) => {
  try {
    const me = req.me;
    if (!me) return res.status(401).json({ error: "Unauthorized" });

    const limit = Number(req.query && req.query.limit);
    const offset = Number(req.query && req.query.offset);

    const result = await query(subscription_queries.listFollowing, [me, limit, offset]);
    return res.json({ following: result.rows, limit, offset });
  } catch (err) {
    console.error("listFollowing failed", err);
    return res.status(500).json({ error: "Failed to list following" });
  }
};

const listFollowers = async (req, res) => {
  try {
    const me = req.me;
    if (!me) return res.status(401).json({ error: "Unauthorized" });

    const limit = Number(req.query && req.query.limit);
    const offset = Number(req.query && req.query.offset);

    const result = await query(subscription_queries.listFollowers, [me, limit, offset]);
    return res.json({ followers: result.rows, limit, offset });
  } catch (err) {
    console.error("listFollowers failed", err);
    return res.status(500).json({ error: "Failed to list followers" });
  }
};

module.exports = { subscribe, unsubscribe, getStatus, listFollowing, listFollowers };

