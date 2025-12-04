import "dotenv/config";

export const ENV = {
  // ─────────────────────────────
  // External services
  // ─────────────────────────────
  REMINDER_SERVICE_BASEURL: process.env.REMINDER_SERVICE_BASEURL!,
  USER_SERVICE_BASEURL: process.env.USER_SERVICE_BASEURL!,

  // ─────────────────────────────
  // Polling
  // ─────────────────────────────
  POLL_INTERVAL_MS: Number(process.env.POLL_INTERVAL_MS ?? 30_000),
  DUE_WINDOW_SEC: Number(process.env.DUE_WINDOW_SEC ?? 60),

  // ─────────────────────────────
  // Security / headers
  // ─────────────────────────────
  AUTH_BEARER: process.env.AUTH_BEARER ?? "DEV",
  TZ: process.env.TZ ?? "Asia/Singapore",
};
