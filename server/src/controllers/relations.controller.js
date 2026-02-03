const { query } = require("../db");
const { relations: relation_queries } = require("../db/queries");

const toInt = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : null;
};

const normalizePair = (id1, id2) => {
  const a = Math.min(id1, id2);
  const b = Math.max(id1, id2);
  return { userA: a, userB: b };
};

// Create a friend request.
// Body: { recipientId: number }
const createRequest = async (req, res) => {
  try {
    const me = req.me;
    const recipientId = toInt(req.body && req.body.recipientId);

    if (!me) return res.status(401).json({ error: "Unauthorized" });
    if (recipientId === me) return res.status(400).json({ error: "Cannot friend-request yourself" });

    const recipient = await query(relation_queries.userExists, [recipientId]);
    if (recipient.rowCount === 0) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    const { userA, userB } = normalizePair(me, recipientId);
    const existing = await query(relation_queries.getRelationByPair, [userA, userB]);

    if (existing.rowCount > 0) {
      const rel = existing.rows[0];

      if (rel.status === "accepted") {
        return res.status(409).json({ error: "Already friends" });
      }

      if (rel.status === "pending") {
        if (rel.requested_by === me) {
          return res.status(409).json({ error: "Friend request already sent" });
        }
        return res
          .status(409)
          .json({ error: "You already have an incoming friend request from this user" });
      }

      // Re-open a previously rejected relation as a new pending request.
      const reopened = await query(relation_queries.toPendingByIdReturningRelation, [rel.id, me]);
      return res.status(200).json({
        relation: reopened.rows[0],
        recipient: recipient.rows[0]
      });
    }

    const created = await query(relation_queries.insertPendingRelation, [userA, userB, me]);
    return res.status(201).json({ relation: created.rows[0], recipient: recipient.rows[0] });
  } catch (err) {
    console.error("createRequest failed", err);
    return res.status(500).json({ error: "Failed to create friend request" });
  }
};

// List pending incoming friend requests for the authenticated user.
const listIncomingRequests = async (req, res) => {
  try {
    const me = req.me;
    if (!me) return res.status(401).json({ error: "Unauthorized" });

    const result = await query(relation_queries.listIncoming, [me]);
    return res.json({ requests: result.rows });
  } catch (err) {
    console.error("listIncomingRequests failed", err);
    return res.status(500).json({ error: "Failed to list incoming requests" });
  }
};

// List pending outgoing friend requests for the authenticated user.
const listOutgoingRequests = async (req, res) => {
  try {
    const me = req.me;
    if (!me) return res.status(401).json({ error: "Unauthorized" });

    const result = await query(relation_queries.listOutgoing, [me]);
    return res.json({ requests: result.rows });
  } catch (err) {
    console.error("listOutgoingRequests failed", err);
    return res.status(500).json({ error: "Failed to list outgoing requests" });
  }
};

// Accept a friend request by relation id.
const acceptRequest = async (req, res) => {
  try {
    const me = req.me;
    const relationId = toInt(req.params && req.params.id);
    if (!me) return res.status(401).json({ error: "Unauthorized" });
    if (!relationId) return res.status(400).json({ error: "Invalid request id" });

    const existing = await query(relation_queries.getRelationById, [relationId]);
    if (existing.rowCount === 0) return res.status(404).json({ error: "Request not found" });

    const rel = existing.rows[0];
    if (rel.status !== "pending") return res.status(409).json({ error: `Request is ${rel.status}` });
    if (rel.user_a !== me && rel.user_b !== me) return res.status(403).json({ error: "Forbidden" });
    if (rel.requested_by === me) return res.status(400).json({ error: "Cannot accept your own request" });

    const updated = await query(relation_queries.statusByIdReturningRelation, [relationId, "accepted"]);
    return res.json({ relation: updated.rows[0] });
  } catch (err) {
    console.error("acceptRequest failed", err);
    return res.status(500).json({ error: "Failed to accept request" });
  }
};

// Reject a friend request by relation id.
const rejectRequest = async (req, res) => {
  try {
    const me = req.me;
    const relationId = toInt(req.params && req.params.id);
    if (!me) return res.status(401).json({ error: "Unauthorized" });
    if (!relationId) return res.status(400).json({ error: "Invalid request id" });

    const existing = await query(relation_queries.getRelationById, [relationId]);
    if (existing.rowCount === 0) return res.status(404).json({ error: "Request not found" });

    const rel = existing.rows[0];
    if (rel.status !== "pending") return res.status(409).json({ error: `Request is ${rel.status}` });
    if (rel.user_a !== me && rel.user_b !== me) return res.status(403).json({ error: "Forbidden" });
    if (rel.requested_by === me) return res.status(400).json({ error: "Cannot reject your own request" });

    const updated = await query(relation_queries.statusByIdReturningRelation, [relationId, "rejected"]);
    return res.json({ relation: updated.rows[0] });
  } catch (err) {
    console.error("rejectRequest failed", err);
    return res.status(500).json({ error: "Failed to reject request" });
  }
};

// Cancel a pending outgoing friend request by relation id.
const cancelRequest = async (req, res) => {
  try {
    const me = req.me;
    const relationId = toInt(req.params && req.params.id);
    if (!me) return res.status(401).json({ error: "Unauthorized" });
    if (!relationId) return res.status(400).json({ error: "Invalid request id" });

    const existing = await query(relation_queries.getRelationById, [relationId]);
    if (existing.rowCount === 0) return res.status(404).json({ error: "Request not found" });

    const rel = existing.rows[0];
    if (rel.status !== "pending") return res.status(409).json({ error: `Request is ${rel.status}` });
    if (rel.requested_by !== me) return res.status(403).json({ error: "Forbidden" });

    const deleted = await query(relation_queries.byIdReturningId, [relationId]);
    if (deleted.rowCount === 0) return res.status(404).json({ error: "Request not found" });
    return res.status(204).send();
  } catch (err) {
    console.error("cancelRequest failed", err);
    return res.status(500).json({ error: "Failed to cancel request" });
  }
};

// List accepted friends for the authenticated user.
const listFriends = async (req, res) => {
  try {
    const me = req.me;
    if (!me) return res.status(401).json({ error: "Unauthorized" });

    const result = await query(relation_queries.listFriends, [me]);
    return res.json({ friends: result.rows });
  } catch (err) {
    console.error("listFriends failed", err);
    return res.status(500).json({ error: "Failed to list friends" });
  }
};

// Unfriend a user by their user id.
const unfriend = async (req, res) => {
  try {
    const me = req.me;
    const otherUserId = toInt(req.params && req.params.userId);
    if (!me) return res.status(401).json({ error: "Unauthorized" });
    if (!otherUserId) return res.status(400).json({ error: "Invalid user id" });
    if (otherUserId === me) return res.status(400).json({ error: "Cannot unfriend yourself" });

    const { userA, userB } = normalizePair(me, otherUserId);
    const deleted = await query(relation_queries.byPairReturningId, [userA, userB]);
    if (deleted.rowCount === 0) return res.status(404).json({ error: "Friendship not found" });

    return res.status(204).send();
  } catch (err) {
    console.error("unfriend failed", err);
    return res.status(500).json({ error: "Failed to unfriend user" });
  }
};

module.exports = {
  createRequest,
  listIncomingRequests,
  listOutgoingRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  listFriends,
  unfriend
};
