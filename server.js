require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// PostgreSQL pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Search API
app.get("/api/search", async (req, res) => {
  const q = req.query.q;

  if (!q || q.length < 2) {
    return res.json([]);
  }

  try {
    const query = `
  SELECT su.id, p.name, p.uid, p.type, p.model_id
  FROM spatial_unit su
  JOIN party p ON su.pid = p.pid
  WHERE p.name ILIKE $1 OR p.uid ILIKE $1 OR p.type ILIKE $1
  LIMIT 20
`;

    const result = await pool.query(query, [`%${q}%`]);
    console.log(`Found ${result.rows.length} results`); // Debug
    res.json(result.rows);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message }); //more detailed error
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log(`Database connected to ${process.env.DB_HOST}`);
});
