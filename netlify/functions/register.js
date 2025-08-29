import { neon } from "@netlify/neon";

// Connect to your Neon database using environment variable
const sql = neon(process.env.DATABASE_URL);

export async function handler(event) {
  try {
    // Parse the JSON body sent from the frontend
    const { fullname, email, password } = JSON.parse(event.body);

    // Simple validation
    if (!fullname || !email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "All fields are required." }),
      };
    }

    // Check if the email is already registered
    const [existingUser] = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser) {
      return {
        statusCode: 409,
        body: JSON.stringify({ success: false, message: "Email already registered." }),
      };
    }

    // Insert new user into the database
    await sql`
      INSERT INTO users (fullname, email, password)
      VALUES (${fullname}, ${email}, ${password})
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Registration successful!" }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error." }),
    };
  }
}
