// /.netlify/functions/orders.js
exports.handler = async function(event) {
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: 'Method Not Allowed' })
        };
    }

    try {
        // Parse the JSON sent from the frontend
        const order = JSON.parse(event.body);
        console.log('Received order:', order);

        // Here you could save the order to a database (MySQL, Firebase, Airtable, etc.)
        // For now, we just return success with a fake order ID
        const orderId = Date.now(); // Example ID

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, orderId })
        };
    } catch (error) {
        console.error('Error processing order:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Server Error' })
        };
    }
};
