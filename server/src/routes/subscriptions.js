const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireAuth } = require("../middleware/auth");
const { attachMe } = require("../middleware/me");
const { validateParams, validateQuery } = require("../middleware/validate");
const { userIdParamsSchema, listSubscriptionsQuerySchema } = require("../validation/subscriptions");
const {
  subscribe,
  unsubscribe,
  getStatus,
  listFollowing,
  listFollowers
} = require("../controllers/subscription.controller");

const router = express.Router();

router.use(requireAuth, attachMe);

const subscribeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.me || req.ip),
  handler: (req, res) => res.status(429).json({ error: "Too many subscription actions" })
});

router.get("/following", validateQuery(listSubscriptionsQuerySchema), listFollowing);
router.get("/followers", validateQuery(listSubscriptionsQuerySchema), listFollowers);

router.post("/:userId", subscribeLimiter, validateParams(userIdParamsSchema), subscribe);
router.delete("/:userId", subscribeLimiter, validateParams(userIdParamsSchema), unsubscribe);
router.get("/:userId", validateParams(userIdParamsSchema), getStatus);

module.exports = router;

