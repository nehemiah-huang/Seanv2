/* FILE: backend/routes/sales.js | Sales routes */

const express = require('express');
const pool    = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

// GET /api/sales
router.get('/', async (req, res) => {
  try {
    const [sales] = await pool.query(
      'SELECT * FROM sales ORDER BY created_at DESC'
    );

    // Attach items to each sale
    for (const sale of sales) {
      const [items] = await pool.query(
        'SELECT * FROM sale_items WHERE sale_id = ?', [sale.id]
      );
      sale.items = items;
    }

    res.json(sales);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/sales
router.post('/', async (req, res) => {
  const { items, subtotal, discount, grandTotal, paymentMethod } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Sale must have at least one item' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert sale
    const [result] = await conn.query(
      'INSERT INTO sales (subtotal, discount, grand_total, payment_method, cashier, cashier_id) VALUES (?, ?, ?, ?, ?, ?)',
      [subtotal, discount || 0, grandTotal, paymentMethod, req.user.name, req.user.id]
    );

    const saleId = result.insertId;

    // Insert sale items and deduct stock
    for (const item of items) {
      await conn.query(
        'INSERT INTO sale_items (sale_id, drug_id, drug_name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)',
        [saleId, item.id, item.name, item.qty, item.price, item.qty * item.price]
      );

      await conn.query(
        'UPDATE drugs SET stock = GREATEST(stock - ?, 0) WHERE id = ?',
        [item.qty, item.id]
      );
    }

    // Audit log
    await conn.query(
      'INSERT INTO audit_log (action, detail, user_name, user_role, user_id) VALUES (?, ?, ?, ?, ?)',
      ['SALE_COMPLETED', `Sale completed — GH₵${grandTotal} via ${paymentMethod}`, req.user.name, req.user.role, req.user.id]
    );

    await conn.commit();
    res.status(201).json({ id: saleId, message: 'Sale recorded successfully' });

  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;