const Joi = require("joi");

const positiveInt = Joi.number().integer().min(1);

const postType = Joi.string().valid("status", "link", "video", "media").required();
const visibility = Joi.string().valid("public", "friends", "private").default("public");

const url = Joi.string().uri({ scheme: ["http", "https"] }).max(2048);

const attachmentSchema = Joi.object({
  type: Joi.string().valid("image", "video", "link", "file").required(),
  url: url.required(),
  mime: Joi.string().max(100),
  width: Joi.number().integer().min(1),
  height: Joi.number().integer().min(1),
  durationSec: Joi.number().integer().min(0),
  title: Joi.string().max(280),
  provider: Joi.string().max(80)
});

const createPostSchema = Joi.object({
  type: postType,
  text: Joi.string().max(5000).allow(""),
  linkUrl: url,
  videoUrl: url,
  attachments: Joi.array().items(attachmentSchema).max(10).default([]),
  visibility
}).custom((value, helpers) => {
  if (value.type === "status") {
    if (!value.text || !value.text.trim()) {
      return helpers.message("text is required for status posts");
    }
  }

  if (value.type === "link") {
    if (!value.linkUrl) {
      return helpers.message("linkUrl is required for link posts");
    }
  }

  if (value.type === "video") {
    if (!value.videoUrl) {
      return helpers.message("videoUrl is required for video posts");
    }
  }

  if (value.type === "media") {
    if (!Array.isArray(value.attachments) || value.attachments.length === 0) {
      return helpers.message("attachments is required for media posts");
    }
  }

  return value;
});

const createStatusPostSchema = Joi.object({
  text: Joi.string().max(5000).required(),
  attachments: Joi.array().items(attachmentSchema).max(10).default([]),
  visibility
});

const createLinkPostSchema = Joi.object({
  text: Joi.string().max(5000).allow(""),
  linkUrl: url.required(),
  attachments: Joi.array().items(attachmentSchema).max(10).default([]),
  visibility
});

const createVideoPostSchema = Joi.object({
  text: Joi.string().max(5000).allow(""),
  videoUrl: url.required(),
  attachments: Joi.array().items(attachmentSchema).max(10).default([]),
  visibility
});

const createMediaPostSchema = Joi.object({
  text: Joi.string().max(5000).allow(""),
  attachments: Joi.array().items(attachmentSchema).max(10).min(1).required(),
  visibility
});

const updatePostSchema = Joi.object({
  text: Joi.string().max(5000).allow(""),
  linkUrl: url.allow(null),
  videoUrl: url.allow(null),
  attachments: Joi.array().items(attachmentSchema).max(10),
  visibility
})
  .min(1)
  .required();

const postIdParamsSchema = Joi.object({
  id: positiveInt.required()
});

const listPostsQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  authorId: positiveInt
});

module.exports = {
  createPostSchema,
  createStatusPostSchema,
  createLinkPostSchema,
  createVideoPostSchema,
  createMediaPostSchema,
  updatePostSchema,
  postIdParamsSchema,
  listPostsQuerySchema
};
