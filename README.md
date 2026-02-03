# simple-social

A small social backend (Node.js + Express + Postgres) with:

- JWT auth (`/auth`)
- Friend requests + friendships (`/relations`)
- Posts: status updates, link posts, video URL posts, and media/attachments posts (`/posts`)
- Subscriptions (follow/unfollow) (`/subscriptions`)

## How AI Was Used

Most of the code in this repository was generated and iteratively refined using an AI coding assistant (GPT-based)
running in a local “coding agent” workflow (it could read/edit files, run commands, and apply patches).
The workflow was prompt-driven and incremental:

- I described the feature I wanted (e.g. friend requests, posts, subscriptions).
- The assistant created/edited files, refactored routes into controllers, and extracted SQL into a shared queries module.
- I reviewed behavior, asked for naming/structure changes, and the assistant applied updates.

Examples of things AI assisted with in this repo:

- Splitting route logic into controllers (e.g. relations and subscriptions)
- Adding validation (Joi) and request-level helpers like `req.me`
- Adding a minimal SQL migration runner and migrations for tables
- Adding rate limiting to “write” endpoints

This means:

- The codebase is intentionally simple and optimized for speed of iteration.
- You should still review, test, and harden it before using it in production (logging, security, migrations discipline, etc.).

## Project Layout

- `client/` - frontend (not documented here)
- `server/` - backend (Express API)
  - `server/src/server.js` - app entrypoint
  - `server/src/controllers/` - controllers (business logic)
  - `server/src/routes/` - express routers (HTTP wiring)
  - `server/src/db/` - db helpers, queries, and migrations
  - `server/src/validation/` - Joi schemas
  - `server/src/middleware/` - auth + validation helpers

## Prerequisites

- Node.js + npm
- Postgres (tested with Postgres 17)

## Setup & Run

1) Install server dependencies:

```bash
cd server
npm install
```

2) Create `server/.env`:

```env
DATABASE_URL=postgres://YOUR_USER@localhost:5432/ss
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
PORT=4000
JWT_EXPIRES_IN=1h
```

If the database doesn't exist yet:

```bash
createdb ss
```

3) Run migrations (creates tables in the `kss` schema):

```bash
cd server
npm run db:migrate
```

4) Start the server:

```bash
cd server
npm run dev
```

Health check:

```bash
curl -s http://localhost:4000/health
```

## Auth

All protected routes require:

```
Authorization: Bearer <token>
```

### Endpoints

- `POST /auth/register` body: `{ "email": "...", "password": "...", "name": "..." }`
- `POST /auth/login` body: `{ "email": "...", "password": "..." }`

Returns `{ user, token }`.

Controller: `server/src/controllers/auth.controller.js`

## Friend Requests / Friendships

Base path: `/relations`

- `POST /relations/requests` body: `{ "recipientId": 123 }`
- `GET /relations/requests/incoming`
- `GET /relations/requests/outgoing`
- `POST /relations/requests/:id/accept`
- `POST /relations/requests/:id/reject`
- `DELETE /relations/requests/:id` (cancel outgoing pending request)
- `GET /relations/friends`
- `DELETE /relations/friends/:userId` (unfriend)

Notes:
- Requests are rate-limited.
- `req.me` is attached once per request (`requireAuth` + `attachMe`) and used by the controller.

Controller: `server/src/controllers/relations.controller.js`  
Routes: `server/src/routes/relations.js`

## Posts

Base path: `/posts`

Multiple ways to create a post:

- Generic (client supplies `type`):
  - `POST /posts` body includes `type`
- Convenience endpoints (server forces the type):
  - `POST /posts/status`
  - `POST /posts/link`
  - `POST /posts/video`
  - `POST /posts/media`

Other endpoints:

- `GET /posts?limit=20&offset=0&authorId=123` (authorId optional)
- `GET /posts/:id`
- `PATCH /posts/:id`
- `DELETE /posts/:id` (soft delete via `deleted_at`)

Post "types":
- `status`: text-based update
- `link`: includes `linkUrl`
- `video`: includes `videoUrl` (URL-based, not file upload)
- `media`: includes non-empty `attachments` array

Controller: `server/src/controllers/post.controller.js`  
Routes: `server/src/routes/posts.js`  
Validation: `server/src/validation/posts.js`

## Subscriptions (Follow / Unfollow)

Base path: `/subscriptions`

- `POST /subscriptions/:userId` (follow)
- `DELETE /subscriptions/:userId` (unfollow; soft delete via `deleted_at`)
- `GET /subscriptions/:userId` (status)
- `GET /subscriptions/following?limit&offset`
- `GET /subscriptions/followers?limit&offset`

Controller: `server/src/controllers/subscription.controller.js`  
Routes: `server/src/routes/subscriptions.js`

## Other Controllers

- `server/src/controllers/user.controller.js`
  - Contains CRUD helpers for users (create/read/update/delete + `me`).
  - Currently **not mounted** in `server/src/server.js` (no `/users` router yet).

## Database

SQL lives in:

- `server/src/db/queries.js` (app SQL used by controllers)
- `server/src/db/migrations/` (schema migrations)
- `server/src/db/schema.sql` (snapshot / reference)

Migrations are applied by:

- `server/src/db/migrate.js`
- `npm run db:migrate` (from `server/`)

Tables (in schema `kss`):

- `kss.users`
- `kss.relations` (friend requests / friendships)
- `kss.posts`
- `kss.subscriptions` (followers/following)

## Viewing The ER Diagram (PhpStorm)

In PhpStorm:

1) Open `Database` tool window and connect to Postgres.
2) Select schema `kss`.
3) Right-click the schema or tables -> `Diagrams` -> `Show Visualization`.

Why you might see two `users` boxes:
- The diagram tool sometimes duplicates the same table node to make multiple foreign key lines easier to read.
  It is still one physical table.

## Security Notes

- Do not commit `.env` files or API keys.
- Rotate/revoke any credentials that were ever pasted into chat logs or committed.
