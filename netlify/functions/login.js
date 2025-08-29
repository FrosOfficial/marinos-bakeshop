import { neon } from "@netlify/neon";

// Connect to your Neon database
const sql = neon(process.env.DATABASE_URL);

export async function handler(event) {
  try {
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Email and password are required." }),
      };
    }

    // Fetch user by email
    const [user] = await sql`
      SELECT id, fullname, email, password
      FROM users
      WHERE email = ${email}
    `;

    if (!user || user.password !== password) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "Invalid email or password." }),
      };
    }

    // Return user data (you may omit password if you want)
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, user }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error." }),
    };
  }
}
