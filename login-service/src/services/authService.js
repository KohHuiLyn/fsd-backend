import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as userService from "./userService.js";

/**
 * In-memory maps to track failed login attempts and lockout timers
 * These reset automatically when the server restarts (sufficient for demo / academic purpose)
 */
const failedAttempts = new Map(); // { email: count }
const lockoutMap = new Map();     // { email: lockoutExpiryTimestamp }

/**
 * LOGIN
 * Implements lockout after 5 consecutive failed attempts for 5 minutes
 */
export async function login({ email, password }) {
  try {
    // 1️⃣ Check if account is locked
    if (lockoutMap.has(email)) {
      const unlockTime = lockoutMap.get(email);
      if (Date.now() < unlockTime) {
        const remaining = Math.ceil((unlockTime - Date.now()) / 1000);
        return {
          status: 429,
          body: { message: `Account temporarily locked. Try again in ${remaining}s.` },
        };
      } else {
        // Auto-remove expired lock
        lockoutMap.delete(email);
      }
    }

    // 2️⃣ Fetch user from user-service
    const user = await userService.getUserByEmail(email);
    if (!user) {
      trackFailedAttempt(email);
      return { status: 401, body: { message: "Invalid email or password" } };
    }
    console.log(user);

    // 3️⃣ Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      trackFailedAttempt(email);
      return { status: 401, body: { message: "Invalid email or password" } };
    }

    // 4️⃣ Successful login → reset counters
    failedAttempts.delete(email);
    lockoutMap.delete(email);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      status: 200,
      body: {
        message: "Login successful",
        token,
        user: { id: user.id, email: user.email, role: user.role, phoneNumber: user.phone_number },
      },
    };
  } catch (err) {
    console.error("Login service error:", err.message);
    return { status: 500, body: { message: "Authentication service error" } };
  }
}

/**
 * REGISTER
 */
export async function register({ email, username, phoneNumber, password, role }) {
  try {
    const existing = await userService.getUserByEmail(email);
    if (existing) {
      return { status: 409, body: { message: "User already exists" } };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userService.createUser({
      email,
      username,
      phoneNumber,
      passwordHash,
      role,
    });

    const token = jwt.sign(
      { id: user.id, email, role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      status: 201,
      body: {
        message: "Registration successful",
        token,
      },
    };
  } catch (err) {
    console.error("Register service error:", err.message);
    return { status: 500, body: { message: "Registration failed" } };
  }
}

/**
 * Helper: track failed attempts and lock account if threshold exceeded
 */
function trackFailedAttempt(email) {
  const count = failedAttempts.get(email) || 0;
  failedAttempts.set(email, count + 1);

  if (failedAttempts.get(email) >= 5) {
    // Lock account for 5 minutes
    lockoutMap.set(email, Date.now() + 5 * 60 * 1000);
    failedAttempts.delete(email);
    console.warn(`🔒 Account locked for ${email} due to repeated failed logins.`);
  }
}
