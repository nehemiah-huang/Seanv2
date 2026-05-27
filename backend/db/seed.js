/* FILE: backend/db/seed.js | Seed default users into MySQL */

require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const pool   = require('../config/db');

async function seed() {
  const users = [
    { name:'Admin',      username:'admin',       password:'admin123',  role:'Admin'      },
    { name:'Dr. Asante', username:'pharmacist',  password:'pharm123',  role:'Pharmacist' },
    { name:'Kofi',       username:'attendant',   password:'attend123', role:'Attendant'  },
  ];

  for (const user of users) {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ?', [user.username]
    );
    if (existing.length) {
      console.log(`Skipping ${user.username} — already exists`);
      continue;
    }
    const hash = await bcrypt.hash(user.password, 10);
    await pool.query(
      'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
      [user.name, user.username, hash, user.role]
    );
    console.log(`Created user: ${user.username}`);
  }

  console.log('Seeding complete');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });