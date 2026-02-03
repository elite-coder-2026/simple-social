const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireAuth } = require("../middleware/auth");
const { attachMe } = require("../middleware/me");
const { validateBody, validateParams, validateQuery } = require("../middleware/validate");
const {
  createPostSchema,
  createStatusPostSchema,
  createLinkPostSchema,
  createVideoPostSchema,
  createMediaPostSchema,
  updatePostSchema,
  postIdParamsSchema,
  listPostsQuerySchema
} = require("../validation/posts");
const {
  createPost,
  createStatusPost,
  createLinkPost,
  createVideoPost,
  createMediaPost,
  getPost,
  listPosts,
  updatePost,
  deletePost
} = require("../controllers/post.controller");

const router = express.Router();

router.use(requireAuth, attachMe);

const createPostLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.me || req.ip),
  handler: (req, res) => res.status(429).json({ error: "Too many posts" })
});

// Generic create endpoint (accepts { type, ... }).
router.post("/", createPostLimiter, validateBody(createPostSchema), createPost);

// Convenience endpoints: multiple ways to create posts without the client sending `type`.
router.post("/status", createPostLimiter, validateBody(createStatusPostSchema), createStatusPost);
router.post("/link", createPostLimiter, validateBody(createLinkPostSchema), createLinkPost);
router.post("/video", createPostLimiter, validateBody(createVideoPostSchema), createVideoPost);
router.post("/media", createPostLimiter, validateBody(createMediaPostSchema), createMediaPost);
router.get("/", validateQuery(listPostsQuerySchema), listPosts);
router.get("/:id", validateParams(postIdParamsSchema), getPost);
router.patch("/:id", validateParams(postIdParamsSchema), validateBody(updatePostSchema), updatePost);
router.delete("/:id", validateParams(postIdParamsSchema), deletePost);

module.exports = router;
