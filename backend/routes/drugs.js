/* FILE: backend/routes/drugs.js | Drug routes */

const express = require('express');
const pool    = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All drug routes require auth
router.use(verifyToken);

// GET /api/drugs
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM drugs ORDER BY name ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/drugs
router.post('/', async (req, res) => {
  const { name, category, stock, price, expiry, supplier } = req.body;

  if (!name || !category || !expiry) {
    return res.status(400).json({ error: 'Name, category and expiry are required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO drugs (name, category, stock, price, expiry, supplier) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category, stock || 0, price || 0, expiry, supplier || null]
    );

    await pool.query(
      'INSERT INTO audit_log (action, detail, user_name, user_role, user_id) VALUES (?, ?, ?, ?, ?)',
      ['DRUG_ADDED', `Added drug: ${name}`, req.user.name, req.user.role, req.user.id]
    );

    res.status(201).json({ id: result.insertId, message: 'Drug added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/drugs/:id
router.put('/:id', async (req, res) => {
  const { name, category, stock, price, expiry, supplier } = req.body;
  const { id } = req.params;

  if (!name || !category || !expiry) {
    return res.status(400).json({ error: 'Name, category and expiry are required' });
  }

  try {
    await pool.query(
      'UPDATE drugs SET name=?, category=?, stock=?, price=?, expiry=?, supplier=? WHERE id=?',
      [name, category, stock || 0, price || 0, expiry, supplier || null, id]
    );

    await pool.query(
      'INSERT INTO audit_log (action, detail, user_name, user_role, user_id) VALUES (?, ?, ?, ?, ?)',
      ['DRUG_UPDATED', `Updated drug: ${name}`, req.user.name, req.user.role, req.user.id]
    );

    res.json({ message: 'Drug updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/drugs/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT name FROM drugs WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Drug not found' });

    await pool.query('DELETE FROM drugs WHERE id = ?', [id]);

    await pool.query(
      'INSERT INTO audit_log (action, detail, user_name, user_role, user_id) VALUES (?, ?, ?, ?, ?)',
      ['DRUG_DELETED', `Deleted drug: ${rows[0].name}`, req.user.name, req.user.role, req.user.id]
    );

    res.json({ message: 'Drug deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;