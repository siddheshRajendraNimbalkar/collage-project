import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password, role, organization_name, user_image } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    // Create user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, organization_name, user_image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email',
      [name, email, hashedPassword, role || 'college_staff', organization_name || '', user_image || '']
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
}