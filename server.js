const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cors()); 

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres', 
  host: 'localhost',
  database: 'Online Pathology Lab Booking System', 
  password: 'qwaszx12', 
  port: 5432
});



// ---- GET all tests (only active ones) ----
app.get('/tests', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, code, name, description, category, base_price, duration_minutes
       FROM tests
       WHERE active = true
       ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- GET all users (without password hash) ----
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, phone, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- GET all appointments with joined user & test data ----
app.get('/appointments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id,
             a.appointment_date,
             a.slot_start,
             a.slot_end,
             a.status,
             u.full_name AS user_name,
             u.email AS user_email,
             t.name AS test_name,
             t.code AS test_code
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      JOIN tests t ON a.test_id = t.id
      ORDER BY a.appointment_date, a.slot_start
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- CREATE a new appointment ----
app.post('/appointments', async (req, res) => {
  try {
    const { user_id, test_id, appointment_date, slot_start, slot_end, status } = req.body;
    const result = await pool.query(
      `INSERT INTO appointments (user_id, test_id, appointment_date, slot_start, slot_end, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, test_id, appointment_date, slot_start, slot_end, status || 'BOOKED']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// START SERVER
// =============================
app.listen(3000, () => {
  console.log('✅ Server running on port 3000');
});
