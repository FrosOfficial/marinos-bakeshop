// /.netlify/functions/orders.js
const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

exports.handler = async function(event, context) {
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ success: false, message: 'Method Not Allowed' })
        };
    }

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: ''
        };
    }

    const client = await pool.connect();
    
    try {
        // Parse the JSON sent from the frontend
        const order = JSON.parse(event.body);
        console.log('Received order:', order);

        // Start transaction
        await client.query('BEGIN');

        // Insert into orders table
        const orderResult = await client.query(`
            INSERT INTO orders (
                customer_name, 
                user_email, 
                user_fullname, 
                customer_phone, 
                customer_address, 
                payment_method, 
                order_notes, 
                total_amount, 
                order_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING id
        `, [
            order.customerName,
            order.userEmail,
            order.userFullname,
            order.customerPhone,
            order.customerAddress,
            order.paymentMethod,
            order.orderNotes || null,
            order.total,
            new Date(order.orderDate)
        ]);

        const orderId = orderResult.rows[0].id;

        // Insert order items
        for (const item of order.items) {
            await client.query(`
                INSERT INTO order_items (
                    order_id, 
                    product_name, 
                    product_price, 
                    quantity, 
                    subtotal
                ) VALUES ($1, $2, $3, $4, $5)
            `, [
                orderId,
                item.name,
                item.price,
                item.quantity,
                item.totalPrice
            ]);
        }

        // Commit transaction
        await client.query('COMMIT');

        console.log(`Order saved successfully with ID: ${orderId}`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: true, 
                orderId: orderId,
                message: 'Order saved successfully'
            })
        };

    } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        console.error('Error processing order:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: false, 
                message: 'Server Error: ' + error.message 
            })
        };
    } finally {
        // Always release the client back to the pool
        client.release();
    }
};