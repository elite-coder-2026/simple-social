const { Pool } = require("pg");
const { env } = require("../config/env");

const pool = new Pool({
  connectionString: env.databaseUrl || undefined
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
