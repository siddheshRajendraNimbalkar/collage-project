import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const result = await pool.query('SELECT id, name, email FROM users LIMIT 10');
      res.json(result.rows);
    } else if (req.method === 'POST') {
      const { name, email } = req.body;
      await pool.query('INSERT INTO users (name, email) VALUES ($1, $2)', [name, email]);
      res.status(201).json({ status: 'created' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
}