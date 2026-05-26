/* FILE: backend/server.js | Entry point */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/drugs',         require('./routes/drugs'));
app.use('/api/sales',         require('./routes/sales'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/audit',         require('./routes/audit'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'MedCare API running', time: new Date() });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`MedCare API running on http://localhost:${PORT}`);
});