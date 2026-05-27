/* FILE: backend/routes/audit.js | Audit log routes */

const express = require('express');
const pool    = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);
router.use(requireRole('Admin', 'Pharmacist'));

// GET /api/audit
router.get('/', async (req, res) => {
  const { from, to, action, user } = req.query;

  let query  = 'SELECT * FROM audit_log WHERE 1=1';
  const params = [];

  if (from) { query += ' AND DATE(created_at) >= ?'; params.push(from); }
  if (to)   { query += ' AND DATE(created_at) <= ?'; params.push(to);   }
  if (action){ query += ' AND action = ?';            params.push(action);}
  if (user)  { query += ' AND user_name LIKE ?';      params.push(`%${user}%`); }

  query += ' ORDER BY created_at DESC LIMIT 500';

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;