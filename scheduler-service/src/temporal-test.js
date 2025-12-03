/**
 * temporal-cloud-test.ts
 * Run with: npx tsx temporal-cloud-test.ts
 */
import { Connection } from "@temporalio/client";
import * as tls from "tls";
import "dotenv/config";
async function main() {
  console.log("🔌 Connecting to Temporal Cloud...");
  // Create a TLS context that explicitly advertises HTTP/2 ("h2")
  const tlsConfig = {
    ALPNProtocols: ["h2"],
    servername: "ap-southeast-1.aws.api.temporal.io",
  };
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS, // ap-southeast-1.aws.api.temporal.io:7233
    tls: tlsConfig,
    apiKey: process.env.TEMPORAL_API_KEY,
    connectTimeout: 15000,
  });
  console.log("✅ Connected to Temporal Cloud!");
  await connection.close();
}
main().catch((err) => {
  console.error("❌ Failed to connect:");
  console.error(err);
});
//# sourceMappingURL=temporal-test.js.map
