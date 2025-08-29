import { neon } from "@netlify/neon";

// Connect to your Neon database
const sql = neon(process.env.DATABASE_URL);

export async function handler(event) {
  try {
    const data = JSON.parse(event.body);
    const { id, fullname, email, password } = data;

    if (!id || !fullname || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "ID, fullname, and email are required." }),
      };
    }

    // Optionally validate password if changing

    await sql`
      UPDATE users
      SET fullname = ${fullname},
          email = ${email},
          password = COALESCE(${password}, password)
      WHERE id = ${id}
    `;

    // Fetch updated user
    const [updatedUser] = await sql`
      SELECT id, fullname, email
      FROM users
      WHERE id = ${id}
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, user: updatedUser, message: "Profile updated successfully." }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error." }),
    };
  }
}
