import "dotenv/config";
export const ENV = {
  // ─────────────────────────────
  // Temporal.io
  // ─────────────────────────────
  TEMPORAL_ADDRESS: process.env.TEMPORAL_ADDRESS ?? "localhost:7233",
  TEMPORAL_NAMESPACE: process.env.TEMPORAL_NAMESPACE ?? "default",
  TASK_QUEUE: process.env.TASK_QUEUE ?? "reminder-queue",
  TEMPORAL_API_KEY: process.env.TEMPORAL_API_KEY,
  // ─────────────────────────────
  // External services
  // ─────────────────────────────
  REMINDER_SERVICE_BASEURL: process.env.REMINDER_SERVICE_BASEURL,
  USER_SERVICE_BASEURL: process.env.USER_SERVICE_BASEURL,
  // NOTIFY_LAMBDA_URL: process.env.NOTIFY_LAMBDA_URL!,
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
//# sourceMappingURL=env.js.map
