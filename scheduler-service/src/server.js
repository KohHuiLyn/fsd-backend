import express from "express";
import { Connection, ScheduleClient } from "@temporalio/client";
import { ENV } from "./env.js";
async function ensurePollingSchedule() {
  console.log("🕓 Initializing Temporal schedule...");
  // Connects securely to Temporal Cloud
  const connection = await Connection.connect({
    address: ENV.TEMPORAL_ADDRESS, // ap-southeast-1.aws.api.temporal.io:7233
    tls: true, // Temporal Cloud requires TLS
    apiKey: ENV.TEMPORAL_API_KEY, // from environment variable
  });
  const scheduleClient = new ScheduleClient({
    connection,
    namespace: ENV.TEMPORAL_NAMESPACE,
  });
  const scheduleId = "poll-due-reminders";
  const everySeconds = Math.max(5, Math.floor(ENV.POLL_INTERVAL_MS / 1000));
  // 🧹 Always try to delete the old schedule first
  try {
    const handle = scheduleClient.getHandle(scheduleId);
    await handle.delete();
    console.log(
      `🗑️  Deleted existing schedule "${scheduleId}" (if it existed).`,
    );
  } catch {
    // ignore "not found" errors silently
  }
  try {
    const { WorkflowClient } = await import("@temporalio/client");
    const wfClient = new WorkflowClient({
      connection,
      namespace: ENV.TEMPORAL_NAMESPACE, // plantpal.g7sv8
    });
    console.log("🧹 Checking for old PollDueRemindersWorkflow executions...");
    const running = await wfClient.list({
      query: `WorkflowType='PollDueRemindersWorkflow' AND ExecutionStatus='Running'`,
    });
    for await (const w of running) {
      console.log(`🚫 Terminating old workflow: ${w.workflowId}`);
      await wfClient.terminate(w.workflowId, {
        reason: "Replacing with new schedule",
      });
    }
  } catch (err) {
    console.warn("⚠️ Could not auto-terminate old workflows:", err.message);
  }
  console.log(`🆕 Creating new schedule "${scheduleId}"...`);
  await scheduleClient.create({
    scheduleId,
    spec: {
      // Interval-based trigger for clarity
      intervals: [{ every: `${everySeconds}s` }],
    },
    action: {
      type: "startWorkflow",
      workflowType: "PollDueRemindersWorkflow",
      taskQueue: ENV.TASK_QUEUE,
      args: [],
    },
    policies: { overlap: "Skip" },
    state: { paused: false },
  });
  console.log(`✅ Schedule "${scheduleId}" created successfully.`);
}
/**
 * Main startup
 */
async function main() {
  await ensurePollingSchedule();
  const app = express();
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () =>
    console.log(
      `scheduler-service running on port ${PORT} and polling every ${ENV.POLL_INTERVAL_MS / 1000}s`,
    ),
  );
}
main().catch((err) => {
  console.error("❌ Scheduler startup failed:", err);
  process.exit(1);
});
//# sourceMappingURL=server.js.map
