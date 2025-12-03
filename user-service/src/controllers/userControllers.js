import * as userService from "../services/userServices.js";

/**
 * Get user by email
 */
export async function getUserByEmail(req, res) {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "Email query required" });

  try {
    const user = await userService.getUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Get user error:", err.message);
    res.status(500).json({ message: "Database error" });
  }
}

/**
 * Get user by ID
 */
export async function getUserById(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "ID parameter required" });
  try {
    const user = await userService.getUserById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Get user error:", err.message);
    res.status(500).json({ message: "Database error" });
  }
}

/**
 * Create new user
 */
export async function createUser(req, res) {
  try {
    const result = await userService.createUser(req.validated);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("Create user error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Delete user
 */
export async function deleteUser(req, res) {
  try {
    const result = await userService.deleteUser(req.validated);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("Create user error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
