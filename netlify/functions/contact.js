import { neon } from "@netlify/neon";

// Connect to your Neon database
const sql = neon(process.env.DATABASE_URL);

export async function handler(event) {
  try {
    const data = JSON.parse(event.body);

    // Basic validation
    const { name, email, number, subject, message, userId, userEmail, userFullname } = data;
    if (!name || !email || !number || !subject || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "All fields are required." }),
      };
    }

    // Optionally, validate email and phone formats here if needed

    // Insert contact message into database
    await sql`
      INSERT INTO contacts (name, email, number, subject, message, user_id, user_email, user_fullname)
      VALUES (${name}, ${email}, ${number}, ${subject}, ${message}, ${userId}, ${userEmail}, ${userFullname})
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Message sent successfully!" }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error." }),
    };
  }
}
