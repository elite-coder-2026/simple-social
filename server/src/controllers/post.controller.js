const { query } = require("../db");
const { posts: post_queries } = require("../db/queries");

const jsonParam = (value) => JSON.stringify(value === undefined ? null : value);

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

const createPostWithType = (typeOverride) => async (req, res) => {
  try {
    const me = req.me;
    if (!me) return res.status(401).json({ error: "Unauthorized" });

    const { type, text, linkUrl, videoUrl, attachments, visibility } = req.body;
    const finalType = typeOverride || type;

    const result = await query(post_queries.insertReturningPost, [
      me,
      finalType,
      text || null,
      linkUrl || null,
      videoUrl || null,
      jsonParam(attachments || []),
      visibility
    ]);

    return res.status(201).json({ post: result.rows[0] });
  } catch (err) {
    console.error("createPost failed", err);
    return res.status(500).json({ error: "Failed to create post" });
  }
};

const createPost = createPostWithType(null);
const createStatusPost = createPostWithType("status");
const createLinkPost = createPostWithType("link");
const createVideoPost = createPostWithType("video");
const createMediaPost = createPostWithType("media");

const getPost = async (req, res) => {
  try {
    const me = req.me;
    if (!me) return res.status(401).json({ error: "Unauthorized" });

    const id = Number(req.params && req.params.id);
    const result = await query(post_queries.selectById, [id, me]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Post not found" });

    return res.json({ post: result.rows[0] });
  } catch (err) {
    console.error("getPost failed", err);
    return res.status(500).json({ error: "Failed to load post" });
  }
};

const listPosts = async (req, res) => {
  try {
    const me = req.me;
    if (!me) return res.status(401).json({ error: "Unauthorized" });

    const limit = Number(req.query && req.query.limit);
    const offset = Number(req.query && req.query.offset);
    const authorId = req.query && req.query.authorId ? Number(req.query.authorId) : null;

    const result = await query(post_queries.listFeed, [me, limit, offset, authorId]);
    return res.json({ posts: result.rows, limit, offset });
  } catch (err) {
    console.error("listPosts failed", err);
    return res.status(500).json({ error: "Failed to list posts" });
  }
};

const updatePost = async (req, res) => {
  try {
    const me = req.me;
    if (!me) return res.status(401).json({ error: "Unauthorized" });

    const id = Number(req.params && req.params.id);
    const body = req.body || {};

    const text = hasOwn(body, "text") ? body.text : null;
    const linkUrl = hasOwn(body, "linkUrl") ? body.linkUrl : null;
    const videoUrl = hasOwn(body, "videoUrl") ? body.videoUrl : null;
    const attachments = hasOwn(body, "attachments") ? jsonParam(body.attachments) : null;
    const visibility = hasOwn(body, "visibility") ? body.visibility : null;

    const result = await query(post_queries.byIdAndAuthorReturningPost, [
      id,
      me,
      text,
      linkUrl,
      videoUrl,
      attachments,
      visibility
    ]);

    if (result.rowCount === 0) return res.status(404).json({ error: "Post not found" });
    return res.json({ post: result.rows[0] });
  } catch (err) {
    console.error("updatePost failed", err);
    return res.status(500).json({ error: "Failed to update post" });
  }
};

const deletePost = async (req, res) => {
  try {
    const me = req.me;
    if (!me) return res.status(401).json({ error: "Unauthorized" });

    const id = Number(req.params && req.params.id);
    const result = await query(post_queries.markDeletedByIdAndAuthorReturningId, [id, me]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Post not found" });

    return res.status(204).send();
  } catch (err) {
    console.error("deletePost failed", err);
    return res.status(500).json({ error: "Failed to delete post" });
  }
};

module.exports = {
  createPost,
  createStatusPost,
  createLinkPost,
  createVideoPost,
  createMediaPost,
  getPost,
  listPosts,
  updatePost,
  deletePost
};
