import express from "express";
import cron from "node-cron";
import { ENV } from "./env.js";
import { pollAndProcessReminders } from "./scheduler.js";

/**
 * Main startup
 */
async function main() {
  console.log("🚀 Starting scheduler-service...");

  // Calculate cron expression from POLL_INTERVAL_MS
  // Default to every 30 seconds if interval is less than 60 seconds
  const intervalMs = ENV.POLL_INTERVAL_MS;
  const intervalSeconds = Math.max(5, Math.floor(intervalMs / 1000));

  let cronExpression: string;
  if (intervalSeconds < 60) {
    // For intervals less than 60 seconds, use seconds-based cron
    // Format: "*/X * * * * *" (seconds minutes hours day month weekday)
    cronExpression = `*/${intervalSeconds} * * * * *`;
  } else {
    // For intervals >= 60 seconds, use minutes-based cron
    const minutes = Math.floor(intervalSeconds / 60);
    cronExpression = `*/${minutes} * * * *`;
  }

  console.log(`⏰ Setting up cron job: ${cronExpression} (every ${intervalSeconds}s)`);
  console.log(`   → Polling every ${intervalSeconds} seconds`);
  console.log(`   → Due window: ${ENV.DUE_WINDOW_SEC} seconds`);

  // Schedule the cron job
  cron.schedule(cronExpression, async () => {
    await pollAndProcessReminders();
  });

  // Run once immediately on startup (optional, remove if not desired)
  console.log("🔄 Running initial poll...");
  await pollAndProcessReminders();

  // Set up Express server for health checks
  const app = express();
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`✅ scheduler-service running on port ${PORT}`);
    console.log(`   → Health check: http://localhost:${PORT}/health`);
    console.log(`   → Polling every ${intervalSeconds} seconds`);
  });
}

main().catch((err) => {
  console.error("❌ Scheduler startup failed:", err);
  process.exit(1);
});
