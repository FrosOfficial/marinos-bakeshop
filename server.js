const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// ======================
// Middleware
// ======================
app.use(cors({
  origin: 'https://marinosbakeshop.netlify.app', // frontend origin
  credentials: true
}));

// Express has built-in body parsing (no need for body-parser)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (optional – remove if using JWT instead)
app.use(session({
  secret: 'a_strong_secret_key', // replace with secure key
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set true if using HTTPS
}));

// ======================
// Postgres Connection (Neon)
// ======================
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required by Neon
});

db.connect()
  .then(() => console.log("✅ Connected to Neon Postgres"))
  .catch(err => console.error("❌ Database connection error:", err));

// Register route
app.post('/register', async (req, res) => {
  const { fullname, email, password } = req.body;
  try {
    const sql = 'INSERT INTO users (fullname, email, password) VALUES ($1, $2, $3)';
    await db.query(sql, [fullname, email, password]);
    res.json({ message: 'Registration successful!' });
  } catch (err) {
    console.error('Error inserting user:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// Update user profile endpoint
app.post('/api/update-profile', async (req, res) => {
  const { originalEmail, fullname, email, password, gender } = req.body;

  if (!originalEmail) {
    return res.status(400).json({ success: false, message: 'Original email is required' });
  }

  const updates = [];
  const values = [];
  let index = 1;

  if (fullname) { updates.push(`fullname = $${index++}`); values.push(fullname); }
  if (email) { updates.push(`email = $${index++}`); values.push(email); }
  if (password) { updates.push(`password = $${index++}`); values.push(password); }
  if (gender) { updates.push(`gender = $${index++}`); values.push(gender); }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  values.push(originalEmail);

  const sql = `UPDATE users SET ${updates.join(', ')} WHERE email = $${index}`;
  try {
    await db.query(sql, values);
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});



// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({ success: false, message: 'Email and password are required' });
  }

  try {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(sql, [email]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (user.password === password) {
        return res.json({
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            fullname: user.fullname,
            gender: user.gender || ''
          }
        });
      }
    }

    res.json({ success: false, message: 'Invalid email or password' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Orders endpoint
app.post('/api/orders', async (req, res) => {
  const {
    customerName, userEmail, userFullname,
    customerPhone, customerAddress,
    paymentMethod, orderNotes, items, total
  } = req.body;

  if (!customerName || !customerPhone || !customerAddress || !paymentMethod || !items || items.length === 0) {
    return res.json({ success: false, message: 'All required fields must be filled and cart must not be empty' });
  }

  try {
    const orderSql = `
      INSERT INTO orders (
        customer_name, user_email, user_fullname,
        customer_phone, customer_address,
        payment_method, order_notes,
        total_amount, order_date, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),'pending')
      RETURNING id
    `;

    const orderValues = [
      customerName, userEmail, userFullname,
      customerPhone, customerAddress,
      paymentMethod, orderNotes, total
    ];

    const orderResult = await db.query(orderSql, orderValues);
    const orderId = orderResult.rows[0].id;

    // Insert order items
    const itemsSql = `
      INSERT INTO order_items (order_id, product_name, product_price, quantity, subtotal)
      VALUES ${items.map((_, i) =>
        `($1, $${i*4+2}, $${i*4+3}, $${i*4+4}, $${i*4+5})`
      ).join(', ')}
    `;

    const values = [orderId];
    items.forEach(item => {
      values.push(item.name, item.price, item.quantity, item.price * item.quantity);
    });

    await db.query(itemsSql, values);

    res.json({ success: true, message: 'Order placed successfully', orderId });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ success: false, message: 'Database error occurred while saving order' });
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, number, subject, message, userId, userEmail, userFullname } = req.body;

  if (!name || !email || !number || !subject || !message) {
    return res.json({ success: false, message: 'All fields are required' });
  }
  if (!userId) {
    return res.json({ success: false, message: 'User must be logged in to send a message' });
  }

  try {
    const sql = `
      INSERT INTO contact_messages (
        user_id, user_email, user_fullname,
        name, email, phone, subject, message, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
      RETURNING id
    `;

    const values = [userId, userEmail, userFullname, name, email, number, subject, message];
    const result = await db.query(sql, values);

    res.json({ success: true, message: 'Your message has been sent successfully!', messageId: result.rows[0].id });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ success: false, message: 'Database error occurred while saving your message' });
  }
});

// ===== REVIEWS ENDPOINTS =====

// Get all reviews endpoint - NEW ENDPOINT ADDED
app.get('/api/reviews', async (req, res) => {
  try {
    const sql = `
      SELECT id, user_id, user_email, user_fullname as fullname, rating, comment, created_at
      FROM reviews
      ORDER BY created_at DESC
    `;
    const result = await db.query(sql);
    res.json({ success: true, message: 'Reviews fetched successfully', reviews: result.rows });
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ success: false, message: 'Database error occurred while fetching reviews' });
  }
});

app.post('/api/reviews', async (req, res) => {
  const { userId, userEmail, userFullname, rating, comment } = req.body;

  if (!userId || !rating || !comment) {
    return res.json({ success: false, message: 'User ID, rating, and comment are required' });
  }
  if (rating < 1 || rating > 5) {
    return res.json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  try {
    const sql = `
      INSERT INTO reviews (user_id, user_email, user_fullname, rating, comment, created_at)
      VALUES ($1,$2,$3,$4,$5,NOW())
      RETURNING id
    `;
    const result = await db.query(sql, [userId, userEmail, userFullname, rating, comment]);

    res.json({ success: true, message: 'Your review has been submitted successfully!', reviewId: result.rows[0].id });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ success: false, message: 'Database error occurred while saving review' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});