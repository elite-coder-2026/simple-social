const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireAuth } = require("../middleware/auth");
const { attachMe } = require("../middleware/me");
const { validateBody, validateParams } = require("../middleware/validate");
const {
  createRequestSchema,
  relationIdParamsSchema,
  friendUserIdParamsSchema
} = require("../validation/relations");
const {
  createRequest,
  listIncomingRequests,
  listOutgoingRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  listFriends,
  unfriend
} = require("../controllers/relations.controller");

/*
Postgres schema (reference)

create schema if not exists kss;

create table if not exists kss.relations (
  id serial primary key,
  user_a integer not null references kss.users(id) on delete cascade,
  user_b integer not null references kss.users(id) on delete cascade,
  requested_by integer not null references kss.users(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);
*/

const router = express.Router();

// All relations endpoints are authenticated.
router.use(requireAuth, attachMe);

const friendRequestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.me || (req.user && req.user.sub) || req.ip),
  handler: (req, res) => res.status(429).json({ error: "Too many friend requests" })
});

router.post(
  "/requests",
  friendRequestLimiter,
  validateBody(createRequestSchema),
  createRequest
);
router.get("/requests/incoming", listIncomingRequests);
router.get("/requests/outgoing", listOutgoingRequests);
router.post(
  "/requests/:id/accept",
  validateParams(relationIdParamsSchema),
  acceptRequest
);
router.post(
  "/requests/:id/reject",
  validateParams(relationIdParamsSchema),
  rejectRequest
);
router.delete(
  "/requests/:id",
  validateParams(relationIdParamsSchema),
  cancelRequest
);
router.get("/friends", listFriends);
router.delete(
  "/friends/:userId",
  validateParams(friendUserIdParamsSchema),
  unfriend
);

module.exports = router;
