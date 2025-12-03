import { Worker } from "@temporalio/worker";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ENV } from "./env.js";
import * as activities from "./activities.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workflowsPath = join(__dirname, "./workflows.ts");

async function run() {
  console.log("👷 Starting Temporal Worker...");
  console.log(
    `Temporal: ${ENV.TEMPORAL_ADDRESS}  |  Namespace: ${ENV.TEMPORAL_NAMESPACE}`,
  );
  console.log(`Task Queue: ${ENV.TASK_QUEUE}`);

  const worker = await Worker.create({
    workflowsPath,
    activities,
    taskQueue: ENV.TASK_QUEUE,
  });

  await worker.run();
}

run().catch((err) => {
  console.error("❌ Worker failed:", err);
  process.exit(1);
});
