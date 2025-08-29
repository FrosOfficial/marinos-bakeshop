import { neon } from "@netlify/neon";

const sql = neon(process.env.DATABASE_URL);

export async function handler(event) {
  try {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ success: false, message: "Method not allowed." }),
      };
    }

    const data = JSON.parse(event.body);
    const { originalEmail, fullname, email, password, gender } = data;

    console.log("Received update request:", data);

    // Validate required originalEmail (this is what your frontend sends)
    if (!originalEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Original email is required for identification." }),
      };
    }

    // Build dynamic UPDATE query with proper Neon syntax
    const fieldsToUpdate = {};
    if (fullname !== undefined) fieldsToUpdate.fullname = fullname;
    if (email !== undefined) fieldsToUpdate.email = email;
    if (password !== undefined) fieldsToUpdate.password = password;
    if (gender !== undefined) fieldsToUpdate.gender = gender;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "No fields to update." }),
      };
    }

    // Create SET clauses manually for each field
    const setClauses = [];
    const values = [originalEmail]; // First parameter for WHERE clause
    let paramIndex = 2; // Start from $2 since $1 is originalEmail

    if (fieldsToUpdate.fullname !== undefined) {
      setClauses.push(`fullname = $${paramIndex}`);
      values.push(fieldsToUpdate.fullname);
      paramIndex++;
    }
    if (fieldsToUpdate.email !== undefined) {
      setClauses.push(`email = $${paramIndex}`);
      values.push(fieldsToUpdate.email);
      paramIndex++;
    }
    if (fieldsToUpdate.password !== undefined) {
      setClauses.push(`password = $${paramIndex}`);
      values.push(fieldsToUpdate.password);
      paramIndex++;
    }
    if (fieldsToUpdate.gender !== undefined) {
      setClauses.push(`gender = $${paramIndex}`);
      values.push(fieldsToUpdate.gender);
      paramIndex++;
    }

    // Execute the update with raw SQL
    const updateQuery = `UPDATE users SET ${setClauses.join(', ')} WHERE email = $1`;
    console.log("Update query:", updateQuery);
    console.log("Update values:", values);

    await sql(updateQuery, values);

    // Fetch updated user using the new email if it was changed, otherwise use original
    const emailToQuery = email !== undefined ? email : originalEmail;
    const selectResult = await sql`
      SELECT id, fullname, email, gender
      FROM users
      WHERE email = ${emailToQuery}
    `;

    const updatedUser = selectResult[0];

    if (!updatedUser) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: "User not found after update." }),
      };
    }

    console.log("Update successful:", updatedUser);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        user: updatedUser, 
        message: "Profile updated successfully." 
      }),
    };

  } catch (err) {
    console.error("Update-profile error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error: " + err.message }),
    };
  }
}