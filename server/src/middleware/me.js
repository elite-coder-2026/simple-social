const toPositiveInt = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : null;
};

// Requires an auth middleware that sets `req.user` with `{ sub: <userId> }`.
const attachMe = (req, res, next) => {
  const me = toPositiveInt(req.user && req.user.sub);
  if (!me) return res.status(401).json({ error: "Unauthorized" });
  req.me = me;
  return next();
};

module.exports = { attachMe, toPositiveInt };

