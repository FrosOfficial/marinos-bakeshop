import { neon } from "@netlify/neon";

// Connect to your Neon database
const sql = neon(process.env.DATABASE_URL);

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ success: false, message: "Method not allowed." }),
      };
    }

    const data = JSON.parse(event.body);
    const { name, email, number, subject, message, userId, userEmail, userFullname } = data;

    // Validate required fields
    if (!name || !email || !number || !subject || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "All fields are required." }),
      };
    }

    // Insert contact message into database
    const [newMessage] = await sql`
      INSERT INTO contact_messages 
        (name, email, phone, subject, message, user_id, user_email, user_fullname)
      VALUES 
        (${name}, ${email}, ${number}, ${subject}, ${message}, ${userId || null}, ${userEmail || null}, ${userFullname || null})
      RETURNING id, name, email, phone, subject, message, user_id, user_email, user_fullname, created_at, status
    `;

    return {
      statusCode: 201,
      body: JSON.stringify({ success: true, message: "Message sent successfully!", data: newMessage }),
    };
  } catch (err) {
    console.error("Contact function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error. Please try again later." }),
    };
  }
}
