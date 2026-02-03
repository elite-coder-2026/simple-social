const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { env } = require("./config/env");
const authRoutes = require("./routes/auth");
const relationsRoutes = require("./routes/relations");
const postsRoutes = require("./routes/posts");
const subscriptionsRoutes = require("./routes/subscriptions");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/auth", authRoutes);
app.use("/relations", relationsRoutes);
app.use("/posts", postsRoutes);
app.use("/subscriptions", subscriptionsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(env.port, () => {
  console.log(`Server listening on ${env.port}`);
});
