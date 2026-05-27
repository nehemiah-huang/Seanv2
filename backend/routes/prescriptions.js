/* FILE: backend/routes/prescriptions.js | Prescription routes */

const express = require('express');
const pool    = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

// GET /api/prescriptions
router.get('/', async (req, res) => {
  try {
    const [rxs] = await pool.query(
      'SELECT * FROM prescriptions ORDER BY created_at DESC'
    );

    for (const rx of rxs) {
      const [drugs] = await pool.query(
        'SELECT * FROM prescription_drugs WHERE prescription_id = ?', [rx.id]
      );
      rx.drugs = drugs;
    }

    res.json(rxs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/prescriptions
router.post('/', async (req, res) => {
  const { patient, age, doctor, diagnosis, notes, drugs } = req.body;

  if (!patient || !drugs || !drugs.length) {
    return res.status(400).json({ error: 'Patient name and at least one drug are required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO prescriptions (patient, age, doctor, diagnosis, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [patient, age || null, doctor || null, diagnosis || null, notes || null, req.user.id]
    );

    const rxId = result.insertId;

    for (const drug of drugs) {
      await conn.query(
        'INSERT INTO prescription_drugs (prescription_id, drug_name, dosage) VALUES (?, ?, ?)',
        [rxId, drug.name, drug.dosage || 'As directed']
      );
    }

    await conn.query(
      'INSERT INTO audit_log (action, detail, user_name, user_role, user_id) VALUES (?, ?, ?, ?, ?)',
      ['PRESCRIPTION_SAVED', `Prescription saved for ${patient}`, req.user.name, req.user.role, req.user.id]
    );

    await conn.commit();
    res.status(201).json({ id: rxId, message: 'Prescription saved successfully' });

  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;