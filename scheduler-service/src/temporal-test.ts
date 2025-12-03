import { Connection } from "@temporalio/client";
import "dotenv/config";

async function main() {
  console.log("🔌 Connecting to Temporal Cloud...");

  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS!, // e.g. ap-southeast-1.aws.api.temporal.io:7233
    tls: {}, // ✅ simplest valid TLS config
    apiKey: process.env.TEMPORAL_API_KEY!, // ✅ Temporal Cloud API key
    connectTimeout: 15000,
  });

  console.log("✅ Connected to Temporal Cloud!");
  await connection.close();
}

main().catch((err) => {
  console.error("❌ Failed to connect:");
  console.error(err);
});
