const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

// CORS and JSON body parsing
app.use(cors({
  origin: 'https://marinosbakeshop.netlify.app',  // adjust to your frontend origin
  credentials: true
}));
app.use(bodyParser.json());

// Session middleware
app.use(session({
  secret: 'a_strong_secret_key',    // replace with a secure key
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// MySQL connection
require('dotenv').config();
console.log("DB_HOST is:", process.env.DB_HOST);
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect(err => {
  if (err) {
    console.error('MySQL connection failed:', err);
  } else {
    console.log('Connected to MySQL');
  }
});

// Register route
app.post('/register', (req, res) => {
  const { fullname, email, password } = req.body;
  const sql = 'INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)';
  db.query(sql, [fullname, email, password], (err) => {
    if (err) {
      console.error('Error inserting user:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json({ message: 'Registration successful!' });
  });
});

// Update user profile endpoint
app.post('/api/update-profile', (req, res) => {
  const { originalEmail, fullname, email, password, gender } = req.body;

  if (!originalEmail) {
    return res.status(400).json({ success: false, message: 'Original email is required' });
  }

  const updates = [];
  const values = [];

  if (fullname) {
    updates.push('fullname = ?');
    values.push(fullname);
  }
  if (email) {
    updates.push('email = ?');
    values.push(email);
  }
  if (password) {
    updates.push('password = ?');
    values.push(password);
  }
  if (gender) {
    updates.push('gender = ?');
    values.push(gender);
  }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  values.push(originalEmail);

  const sql = `UPDATE users SET ${updates.join(', ')} WHERE email = ?`;

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error updating user:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    return res.json({ success: true, message: 'Profile updated successfully' });
  });
});



// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.json({ 
      success: false, 
      message: 'Email and password are required' 
    });
  }

  try {
    // Query user from database
    const sql = 'SELECT * FROM users WHERE email = ?';
    
    db.query(sql, [email], async (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.json({ 
          success: false, 
          message: 'Database error occurred' 
        });
      }
      
      if (result.length > 0) {
        // User found, check password
        if (result[0].password === password) {
          return res.json({ 
            success: true, 
            message: 'Login successful',
            user: {
              id: result[0].id,
              email: result[0].email,
              fullname: result[0].fullname,
              gender: result[0].gender || ''
            }
          });
        }
      }
      
      // User not found or password doesn't match
      return res.json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.json({ 
      success: false, 
      message: 'An error occurred during login' 
    });
  }
});

// Orders endpoint
app.post('/api/orders', async (req, res) => {
const { 
  customerName, 
  userEmail,        
  userFullname,     
  customerPhone, 
  customerAddress, 
  paymentMethod, 
  orderNotes, 
  items, 
  total, 
  orderDate 
} = req.body;

  // Input validation
  if (!customerName || !customerPhone || !customerAddress || !paymentMethod || !items || items.length === 0) {
    return res.json({ 
      success: false, 
      message: 'All required fields must be filled and cart must not be empty' 
    });
  }

  try {
    // Insert order into orders table
const orderSql = `
  INSERT INTO orders (
    customer_name, 
    user_email,
    user_fullname,
    customer_phone, 
    customer_address, 
    payment_method, 
    order_notes, 
    total_amount, 
    order_date,
    status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
`;
    
 const orderValues = [
  customerName,
  userEmail,        
  userFullname,     
  customerPhone, 
  customerAddress,
  paymentMethod,
  orderNotes,
  total,
  new Date()
];

    // Execute the order insertion
    db.query(orderSql, orderValues, (err, orderResult) => {
      if (err) {
        console.error('Error inserting order:', err);
        return res.json({ 
          success: false, 
          message: 'Database error occurred while saving order' 
        });
      }

      const orderId = orderResult.insertId;

      // Insert order items
      const itemsSql = `
        INSERT INTO order_items (
          order_id, 
          product_name, 
          product_price, 
          quantity, 
          subtotal
        ) VALUES ?
      `;

      const itemsValues = items.map(item => [
        orderId,
        item.name,
        item.price,
        item.quantity,
        item.price * item.quantity
      ]);

      db.query(itemsSql, [itemsValues], (err, itemsResult) => {
        if (err) {
          console.error('Error inserting order items:', err);
          return res.json({ 
            success: false, 
            message: 'Database error occurred while saving order items' 
          });
        }

        // Return success response
        res.json({ 
          success: true, 
          message: 'Order placed successfully',
          orderId: orderId 
        });
      });
    });

  } catch (error) {
    console.error('Order processing error:', error);
    return res.json({ 
      success: false, 
      message: 'An error occurred while processing your order' 
    });
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, number, subject, message, userId, userEmail, userFullname } = req.body;

  // Input validation
  if (!name || !email || !number || !subject || !message) {
    return res.json({ 
      success: false, 
      message: 'All fields are required' 
    });
  }

  // Check if user is authenticated (userId should be present)
  if (!userId) {
    return res.json({ 
      success: false, 
      message: 'User must be logged in to send a message' 
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.json({ 
      success: false, 
      message: 'Invalid email format' 
    });
  }

  try {
    // Insert contact message into database
    const sql = `
      INSERT INTO contact_messages (
        user_id,
        user_email,
        user_fullname,
        name, 
        email, 
        phone, 
        subject, 
        message, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const values = [userId, userEmail, userFullname, name, email, number, subject, message];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error inserting contact message:', err);
        return res.json({ 
          success: false, 
          message: 'Database error occurred while saving your message' 
        });
      }

      // Success response
      res.json({ 
        success: true, 
        message: 'Your message has been sent successfully!',
        messageId: result.insertId 
      });
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return res.json({ 
      success: false, 
      message: 'An error occurred while processing your message' 
    });
  }
});

// ===== REVIEWS ENDPOINTS =====

// Get all reviews endpoint - NEW ENDPOINT ADDED
app.get('/api/reviews', (req, res) => {
  try {
    // Query to get all reviews ordered by creation date (newest first)
    const sql = `
      SELECT 
        id,
        user_id,
        user_email,
        user_fullname as fullname,
        rating,
        comment,
        created_at
      FROM reviews 
      ORDER BY created_at DESC
    `;
    
    db.query(sql, (err, result) => {
      if (err) {
        console.error('Error fetching reviews:', err);
        return res.json({ 
          success: false, 
          message: 'Database error occurred while fetching reviews' 
        });
      }

      // Success response with reviews data
      res.json({ 
        success: true, 
        message: 'Reviews fetched successfully',
        reviews: result || []
      });
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    return res.json({ 
      success: false, 
      message: 'An error occurred while fetching reviews' 
    });
  }
});

// Submit review endpoint - ALWAYS INSERT NEW REVIEW
app.post('/api/reviews', (req, res) => {
  const { userId, userEmail, userFullname, rating, comment } = req.body;

  // Input validation
  if (!userId || !rating || !comment) {
    return res.json({ 
      success: false, 
      message: 'User ID, rating, and comment are required' 
    });
  }

  // Check if rating is valid (1-5)
  if (rating < 1 || rating > 5) {
    return res.json({ 
      success: false, 
      message: 'Rating must be between 1 and 5' 
    });
  }

  // Check if comment is not too long
  if (comment.length > 500) {
    return res.json({ 
      success: false, 
      message: 'Comment must be 500 characters or less' 
    });
  }

  try {
    // ALWAYS INSERT A NEW REVIEW - No checking for existing reviews
    const insertSql = `
      INSERT INTO reviews (
        user_id, 
        user_email, 
        user_fullname, 
        rating, 
        comment, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    const values = [userId, userEmail, userFullname, rating, comment];

    db.query(insertSql, values, (err, result) => {
      if (err) {
        console.error('Error inserting review:', err);
        return res.json({ 
          success: false, 
          message: 'Database error occurred while saving your review' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Your review has been submitted successfully!',
        reviewId: result.insertId 
      });
    });

  } catch (error) {
    console.error('Review submission error:', error);
    return res.json({ 
      success: false, 
      message: 'An error occurred while processing your review' 
    });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});