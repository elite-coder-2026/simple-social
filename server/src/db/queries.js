const user = {
  selectIdByEmail: `SELECT id
                      FROM kss.users
                      WHERE email = $1`,
  selectPublicById: `SELECT id, email, name
                       FROM kss.users
                       WHERE id = $1`,
  selectAuthByEmail: `SELECT id, email, name, password_hash
                        FROM kss.users
                        WHERE email = $1`,
  insertReturningPublic:
      `INSERT INTO kss.users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
  selectIdByEmailExcludingId: `SELECT id
                                 FROM kss.users
                                 WHERE email = $1
                                   AND id <> $2`,
      byIdReturningPublic:
      `UPDATE kss.users
       SET email         = COALESCE($1, email),
           name          = COALESCE($2, name),
           password_hash = COALESCE($3, password_hash)
       WHERE id = $4
       RETURNING id, email, name`,
      byIdReturningId: `DELETE
                           FROM kss.users
                            WHERE id = $1
                            RETURNING id`
};

const relations = {
  userExists: `SELECT id, email, name
                FROM kss.users
                WHERE id = $1`,
  getRelationByPair:
    `SELECT id, user_a, user_b, requested_by, status, created_at
     FROM kss.relations
     WHERE user_a = $1
       AND user_b = $2`,
  getRelationById:
    `SELECT id, user_a, user_b, requested_by, status, created_at
     FROM kss.relations
     WHERE id = $1`,
  insertPendingRelation:
    `INSERT INTO kss.relations (user_a, user_b, requested_by, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING id, user_a, user_b, requested_by, status, created_at`,
      statusByIdReturningRelation:
    `UPDATE kss.relations
     SET status = $2
     WHERE id = $1
     RETURNING id, user_a, user_b, requested_by, status, created_at`,
      toPendingByIdReturningRelation:
    `UPDATE kss.relations
     SET status       = 'pending',
         requested_by = $2
     WHERE id = $1
     RETURNING id, user_a, user_b, requested_by, status, created_at`,
      byIdReturningId: `DELETE
                        FROM kss.relations
                         WHERE id = $1
                         RETURNING id`,
      byPairReturningId:
    `DELETE
     FROM kss.relations
     WHERE user_a = $1
       AND user_b = $2
       AND status = 'accepted'
     RETURNING id`,
  listFriends:
    `SELECT r.id AS relation_id, u.id, u.email, u.name, r.created_at
     FROM kss.relations r
              JOIN kss.users u ON u.id = CASE WHEN r.user_a = $1 THEN r.user_b ELSE r.user_a END
     WHERE r.status = 'accepted'
       AND (r.user_a = $1 OR r.user_b = $1)
     ORDER BY u.name ASC, u.id ASC`,
  listIncoming:
    `SELECT r.id AS relation_id, r.status, r.requested_by, r.created_at, u.id, u.email, u.name
     FROM kss.relations r
              JOIN kss.users u ON u.id = CASE WHEN r.user_a = $1 THEN r.user_b ELSE r.user_a END
     WHERE r.status = 'pending'
       AND r.requested_by <> $1
       AND (r.user_a = $1 OR r.user_b = $1)
     ORDER BY r.id DESC`,
  listOutgoing:
    `SELECT r.id AS relation_id, r.status, r.requested_by, r.created_at, u.id, u.email, u.name
     FROM kss.relations r
              JOIN kss.users u ON u.id = CASE WHEN r.user_a = $1 THEN r.user_b ELSE r.user_a END
     WHERE r.status = 'pending'
       AND r.requested_by = $1
       AND (r.user_a = $1 OR r.user_b = $1)
     ORDER BY r.id DESC`
};

const posts = {
  insertReturningPost:
    `INSERT INTO kss.posts (author_id, type, text, link_url, video_url, attachments, visibility)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
     RETURNING id, author_id, type, text, link_url, video_url, attachments, visibility, created_at, updated_at, edited_at, deleted_at`,
  selectById:
    `SELECT p.id,
            p.author_id,
            p.type,
            p.text,
            p.link_url,
            p.video_url,
            p.attachments,
            p.visibility,
            p.created_at,
            p.updated_at,
            p.edited_at,
            p.deleted_at,
            u.id         AS author_id,
            u.name       AS author_name,
            u.username   AS author_username,
            u.avatar_url AS author_avatar_url
     FROM kss.posts p
              JOIN kss.users u ON u.id = p.author_id
     WHERE p.id = $1
       AND p.deleted_at IS NULL
       AND (p.visibility = 'public' OR p.author_id = $2)`,
  listFeed:
    `SELECT p.id,
            p.author_id,
            p.type,
            p.text,
            p.link_url,
            p.video_url,
            p.attachments,
            p.visibility,
            p.created_at,
            p.updated_at,
            p.edited_at,
            p.deleted_at,
            u.id         AS author_id,
            u.name       AS author_name,
            u.username   AS author_username,
            u.avatar_url AS author_avatar_url
     FROM kss.posts p
              JOIN kss.users u ON u.id = p.author_id
     WHERE p.deleted_at IS NULL
       AND (p.visibility = 'public' OR p.author_id = $1)
       AND ($4::int IS NULL OR p.author_id = $4)
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
  byIdAndAuthorReturningPost:
    `UPDATE kss.posts
     SET text        = COALESCE($3, text),
         link_url    = COALESCE($4, link_url),
         video_url   = COALESCE($5, video_url),
         attachments = COALESCE($6::jsonb, attachments),
         visibility  = COALESCE($7, visibility),
         edited_at   = now()
     WHERE id = $1
       AND author_id = $2
       AND deleted_at IS NULL
     RETURNING id, author_id, type, text, link_url, video_url, attachments, visibility, created_at, updated_at, edited_at, deleted_at`,
	  markDeletedByIdAndAuthorReturningId:
	    `UPDATE kss.posts
	     SET deleted_at = now()
	     WHERE id = $1
	       AND author_id = $2
	       AND deleted_at IS NULL
	     RETURNING id`
	};

const subscriptions = {
  selectTargetById:
    `SELECT id, email, name, username, avatar_url
     FROM kss.users
     WHERE id = $1`,
  upsertReturningSubscription:
    `INSERT INTO kss.subscriptions (subscriber_id, target_user_id)
     VALUES ($1, $2)
     ON CONFLICT (subscriber_id, target_user_id)
       DO UPDATE SET deleted_at = NULL
     RETURNING id, subscriber_id, target_user_id, created_at, updated_at, deleted_at`,
  selectByPair:
    `SELECT id, subscriber_id, target_user_id, created_at, updated_at, deleted_at
     FROM kss.subscriptions
     WHERE subscriber_id = $1
       AND target_user_id = $2`,
  deactivateByPairReturningId:
    `UPDATE kss.subscriptions
     SET deleted_at = now()
     WHERE subscriber_id = $1
       AND target_user_id = $2
       AND deleted_at IS NULL
     RETURNING id`,
  listFollowing:
    `SELECT s.id AS subscription_id,
            s.created_at,
            u.id,
            u.name,
            u.username,
            u.avatar_url
     FROM kss.subscriptions s
              JOIN kss.users u ON u.id = s.target_user_id
     WHERE s.subscriber_id = $1
       AND s.deleted_at IS NULL
     ORDER BY s.created_at DESC
     LIMIT $2 OFFSET $3`,
  listFollowers:
    `SELECT s.id AS subscription_id,
            s.created_at,
            u.id,
            u.name,
            u.username,
            u.avatar_url
     FROM kss.subscriptions s
              JOIN kss.users u ON u.id = s.subscriber_id
     WHERE s.target_user_id = $1
       AND s.deleted_at IS NULL
     ORDER BY s.created_at DESC
     LIMIT $2 OFFSET $3`
};

	module.exports = { user, relations, posts, subscriptions };
