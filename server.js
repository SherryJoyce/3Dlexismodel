require("dotenv").config();
const express = require("express");
const path = require("path");
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

// Search API using full_property_view
app.get("/api/search", async (req, res) => {
  const q = req.query.q;

  if (!q || q.length < 2) {
    return res.json([]);
  }

  try {
    const query = `
      SELECT party_name, id_number
      FROM full_property_view
      WHERE party_name ILIKE $1 OR id_number ILIKE $1
      LIMIT 20
    `;

    console.log("Execute query:", query);
    console.log("Search parameter:", `%${q}%`);

    const result = await pool.query(query, [`%${q}%`]);
    console.log(`Found ${result.rows.length} results`);
    console.log("Query result:", result.rows); // Log actual rows returned
    res.json(result.rows);
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ error: "Internal server error during search." });
  }
});

// Serve index.html for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log(`Database connected to ${process.env.DB_HOST}`);
});
