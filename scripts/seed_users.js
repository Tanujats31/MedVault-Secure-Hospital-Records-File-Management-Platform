// scripts/seed_users.js
// Creates the initial portal login accounts. Run once after the schema in
// sql/setup_portal_app.sql has been applied.
//
// Usage: node scripts/seed_users.js
//
// IMPORTANT: change these passwords immediately after first login in a real
// deployment - they're deliberately simple here so you can log in and test.

require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../src/db');

const seedAccounts = [
  { username: 'dr_amit', full_name: 'Dr. Amit Sharma', role: 'doctor', password: 'DoctorPass123!' },
  { username: 'dr_priya', full_name: 'Dr. Priya Nair', role: 'doctor', password: 'DoctorPass123!' },
  { username: 'nurse_sara', full_name: 'Sara Thomas', role: 'nurse', password: 'NursePass123!' },
  { username: 'admin_raj', full_name: 'Raj Mehta', role: 'itadmin', password: 'AdminPass123!' },
];

async function seed() {
  for (const acc of seedAccounts) {
    const hash = await bcrypt.hash(acc.password, 10);
    try {
      await pool.query(
        'INSERT INTO portal_users (username, full_name, role, password_hash, active) VALUES (?, ?, ?, ?, 1)',
        [acc.username, acc.full_name, acc.role, hash]
      );
      console.log(`Created ${acc.username} (${acc.role}) - password: ${acc.password}`);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log(`${acc.username} already exists, skipping.`);
      } else {
        console.error(`Error creating ${acc.username}:`, err.message);
      }
    }
  }
  process.exit(0);
}

seed();
