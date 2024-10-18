const { Pool } = require("pg");
const dburl = process.env.POSTGRESURL || "";

const pool = new Pool({
  connectionString: dburl,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;
