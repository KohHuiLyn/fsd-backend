import { dbPool } from "../db.js";
const pool = dbPool;

/**
 * Fetch a user by email (active only)
 */
export async function getUserByEmail(email) {
  const query = `
    SELECT *
    FROM users.user_list
    WHERE email = $1
      AND deleted_at IS NULL
    LIMIT 1;
  `;

  try {
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("DB fetch error:", err.message);
    throw err;
  }
}

/**
 * Fetch a user by ID (active only)
 */
export async function getUserById(id) {
  const query = `
    SELECT *
    FROM users.user_list
    WHERE id = $1
      AND deleted_at IS NULL
    LIMIT 1;
  `;

  try {
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("DB fetch error (getUserById):", err.message);
    throw err;
  }
}

/**
 * Create a new user
 * - Checks only active users for conflicts
 * - Also catches DB-level unique violations
 */
export async function createUser({ email, username, phoneNumber, passwordHash, role }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // App-level pre-check among active users
    const conflictQuery = `
      SELECT id, email, username, phone_number
      FROM users.user_list
      WHERE deleted_at IS NULL
        AND (email = $1 OR username = $2 OR phone_number = $3)
      LIMIT 1;
    `;
    const conflictRes = await client.query(conflictQuery, [email, username, phoneNumber]);
    if (conflictRes.rows.length > 0) {
      await client.query("ROLLBACK");
      return { status: 409, body: { message: "User already exists" } };
    }

    // Insert user
    const insertQuery = `
      INSERT INTO users.user_list (email, username, phone_number, password_hash, role, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const result = await client.query(insertQuery, [email, username, phoneNumber, passwordHash, role]);

    await client.query("COMMIT");
    return { status: 201, body: result.rows[0] };
  } catch (err) {
    await client.query("ROLLBACK");

    // Handle unique constraint violation (Postgres code 23505)
    if (err.code === "23505") {
      console.error("Unique violation:", err.detail);
      return { status: 409, body: { message: "User already exists" } };
    }

    console.error("DB create error:", err.message);
    return { status: 500, body: { message: "Database error" } };
  } finally {
    client.release();
  }
}

/**
 * Soft delete a user by setting deleted_at (no-op if already deleted)
 */
export async function deleteUser(id) {
  const query = `
    UPDATE users.user_list
    SET deleted_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL;
  `;

  try {
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) {
      return { status: 404, body: { message: "User not found" } };
    }
    return { status: 200, body: { message: "User deleted successfully" } };
  } catch (err) {
    console.error("DB delete error:", err.message);
    throw err;
  }
}




// import { PrismaClient } from "@prisma/client";
// import { Prisma } from "@prisma/client";
// const prisma = new PrismaClient();

// /**
//  * Fetch a user by email (active only)
//  */
// export async function getUserByEmail(email) {
//   try {
//     return await prisma.user.findFirst({
//       where: { email, deletedAt: null },
//     });
//   } catch (err) {
//     console.error("DB fetch error:", err.message);
//     throw err;
//   }
// }

// /**
//  * Fetch a user by ID (active only)
//  */
// export async function getUserById(id) {
//   try {
//     return await prisma.user.findFirst({
//       where: { id, deletedAt: null },
//     });
//   } catch (err) {
//     console.error("Prisma error (getUserById):", err);
//     throw err;
//   }
// }

// /**
//  * Create a new user
//  * - Checks only active users for conflicts
//  * - Also catches DB-level unique violations (P2002)
//  */
// export async function createUser({ email, username, phoneNumber, passwordHash, role }) {
//   try {
//     // App-level pre-check among active users
//     const conflict = await prisma.user.findFirst({
//       where: {
//         deletedAt: null,
//         OR: [
//           { email },
//           { username },
//           { phoneNumber },
//         ],
//       },
//       select: { id: true, email: true, username: true, phoneNumber: true },
//     });

//     if (conflict) {
//       return { status: 409, body: { message: "User already exists" } };
//     }

//     const newUser = await prisma.user.create({
//       data: { email, username, phoneNumber, passwordHash, role },
//     });

//     return { status: 201, body: newUser };
//   } catch (err) {
//     // Handle DB race-condition conflicts if composite uniques are in place
//     if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
//       // err.meta?.target is an array like ['email','deletedAt'] / ['username','deletedAt']
//       const target = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : "unique field";
//       console.error("Unique violation on:", target);
//       return { status: 409, body: { message: "User already exists" } };
//     }

//     console.error("DB create error:", err.message);
//     return { status: 500, body: { message: "Database error" } };
//   }
// }

// /**
//  * Soft delete a user by setting deletedAt (no-op if already deleted)
//  * - updateMany lets us guard on deletedAt: null
//  * - returns { count } so we can 404 if nothing changed
//  */
// export async function deleteUser(id) {
//   try {
//     const result = await prisma.user.updateMany({
//       where: { id, deletedAt: null },
//       data: { deletedAt: new Date() },
//     });

//     if (result.count === 0) {
//       // Either not found or already deleted
//       return { status: 404, body: { message: "User not found" } };
//     }
//     return { status: 200, body: { message: "User deleted successfully" } };
//   } catch (err) {
//     console.error("Prisma error (deleteUser):", err);
//     throw err;
//   }
// }
