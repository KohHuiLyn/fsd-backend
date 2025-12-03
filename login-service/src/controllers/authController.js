import * as authService from "../services/authService.js";
import {
  loginSuccessCount,
  loginFailureCount,
  registerSuccessCount,
  registerFailureCount,
} from "../metrics.js";

export async function login(req, res) {
  try {
    const result = await authService.login(req.validated);
    if (result.status === 200) loginSuccessCount.inc();
    else loginFailureCount.inc();

    res.status(result.status).json(result.body);
  } catch (err) {
    loginFailureCount.inc();
    console.error("Login controller error:", err.message);
    res.status(500).json({ message: "Internal error during login" });
  }
}

export async function register(req, res) {
  try {
    const result = await authService.register(req.validated);

    if (result.status === 201) registerSuccessCount.inc();
    else registerFailureCount.inc();

    res.status(result.status).json(result.body);
  } catch (err) {
    registerFailureCount.inc();
    console.error("Register controller error:", err.message);
    res.status(500).json({ message: "Internal error during registration" });
  }
}
