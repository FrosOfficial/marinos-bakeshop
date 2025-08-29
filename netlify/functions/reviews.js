import { neon } from "@netlify/neon";

// Connect to your Neon/Postgres database
const sql = neon(process.env.DATABASE_URL);

export async function handler(event) {
  try {
    // Handle GET request - fetch all reviews
    if (event.httpMethod === "GET") {
      const reviews = await sql`
        SELECT id, user_id, user_email, fullname, rating, comment, created_at
        FROM reviews
        ORDER BY created_at DESC
      `;
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, reviews }),
      };
    }

    // Handle POST request - submit a new review
    if (event.httpMethod === "POST") {
      const { userId, userEmail, userFullname, rating, comment } = JSON.parse(event.body);

      // Basic validation
      if (!userId || !userEmail || !userFullname || !rating || !comment) {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: "All fields are required." }),
        };
      }

      if (comment.length > 500) {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: "Comment must be 500 characters or less." }),
        };
      }

      // Insert review into database
      const [newReview] = await sql`
        INSERT INTO reviews (user_id, user_email, fullname, rating, comment)
        VALUES (${userId}, ${userEmail}, ${userFullname}, ${rating}, ${comment})
        RETURNING id, user_id, user_email, fullname, rating, comment, created_at
      `;

      return {
        statusCode: 201,
        body: JSON.stringify({ success: true, review: newReview, message: "Review submitted successfully!" }),
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Method not allowed." }),
    };

  } catch (error) {
    console.error("Reviews function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error. Please try again later." }),
    };
  }
}
