/* FILE: backend/routes/users.js | User management routes */

const express = require('express');
const bcrypt  = require('bcryptjs');
const pool    = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);
router.use(requireRole('Admin', 'Pharmacist'));

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, username, role, created_at FROM users ORDER BY name ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  const { name, username, password, role } = req.body;

  if (!name || !username || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ?', [username]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
      [name, username, hash, role]
    );

    await pool.query(
      'INSERT INTO audit_log (action, detail, user_name, user_role, user_id) VALUES (?, ?, ?, ?, ?)',
      ['USER_CREATED', `Created user: ${name} (${role})`, req.user.name, req.user.role, req.user.id]
    );

    res.status(201).json({ id: result.insertId, message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  const { name, username, password, role } = req.body;
  const { id } = req.params;

  if (!name || !username || !role) {
    return res.status(400).json({ error: 'Name, username and role are required' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? AND id != ?', [username, id]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET name=?, username=?, password=?, role=? WHERE id=?',
        [name, username, hash, role, id]
      );
    } else {
      await pool.query(
        'UPDATE users SET name=?, username=?, role=? WHERE id=?',
        [name, username, role, id]
      );
    }

    await pool.query(
      'INSERT INTO audit_log (action, detail, user_name, user_role, user_id) VALUES (?, ?, ?, ?, ?)',
      ['USER_UPDATED', `Updated user: ${name}`, req.user.name, req.user.role, req.user.id]
    );

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  try {
    const [rows] = await pool.query('SELECT name FROM users WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    await pool.query(
      'INSERT INTO audit_log (action, detail, user_name, user_role, user_id) VALUES (?, ?, ?, ?, ?)',
      ['USER_DELETED', `Deleted user: ${rows[0].name}`, req.user.name, req.user.role, req.user.id]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id/reset-password
router.put('/:id/reset-password', async (req, res) => {
  const { password } = req.body;
  const { id }       = req.params;

  if (!password) {
    return res.status(400).json({ error: 'New password is required' });
  }

  try {
    const [rows] = await pool.query('SELECT name FROM users WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, id]);

    await pool.query(
      'INSERT INTO audit_log (action, detail, user_name, user_role, user_id) VALUES (?, ?, ?, ?, ?)',
      ['PASSWORD_RESET', `Password reset for: ${rows[0].name}`, req.user.name, req.user.role, req.user.id]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;