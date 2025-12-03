import axios from "axios";
import { ENV } from "./env.js";

export type ReminderRow = {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  due_at: string; // ISO8601
  is_proxy: boolean;
  proxy: string | null;
  sent_at?: string | null;
};

const authHeader = () => ({ Authorization: `Bearer ${ENV.AUTH_BEARER}` });

/** List reminders due soon */
// export async function listDueReminders(windowSec: number): Promise<ReminderRow[]> {
//   const { data } = await axios.get(
//     `${ENV.REMINDER_SERVICE_BASEURL}/reminder/v1/reminders/due`,
//     { params: { windowSec }, headers: authHeader() }
//   );
//   return data.reminders ?? [];
// }

/** List reminders due soon */
export async function listDueReminders(
  windowSec: number,
): Promise<ReminderRow[]> {
  const url = `${ENV.REMINDER_SERVICE_BASEURL}/reminder/v1/reminders/due`;

  console.log("🕒 [listDueReminders] Fetching due reminders...");
  console.log(`   → URL: ${url}`);
  console.log(`   → windowSec: ${windowSec}`);
  const start = Date.now();

  try {
    const { data } = await axios.get(url, {
      params: { windowSec },
      headers: authHeader(),
      validateStatus: () => true, // prevent Axios from throwing before we log
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    if (!data) {
      console.error(`❌ [listDueReminders] No data received (${elapsed}s).`);
      return [];
    }

    if (data.reminders && Array.isArray(data.reminders)) {
      console.log(
        `✅ [listDueReminders] Received ${data.reminders.length} reminder(s) (${elapsed}s).`,
      );
      if (data.reminders.length > 0) {
        console.table(
          data.reminders.map((r: ReminderRow) => ({
            id: r.id,
            name: r.name,
            due_at: r.due_at,
            is_proxy: r.is_proxy,
          })),
        );
      }
      return data.reminders;
    }

    console.warn(
      `⚠️ [listDueReminders] Unexpected response format (${elapsed}s):`,
      data,
    );
    return [];
  } catch (err: any) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.error(`❌ [listDueReminders] Request failed after ${elapsed}s`);
    if (axios.isAxiosError(err)) {
      console.error(`   → Status: ${err.response?.status}`);
      console.error(`   → Message: ${err.message}`);
      console.error(`   → URL: ${err.config?.url}`);
    } else {
      console.error("   →", err);
    }
    throw err;
  }
}

/** Resolve correct phone number */
export async function resolveTargetNumber(
  userID: string,
  isProxy: boolean,
  proxy: string | null,
): Promise<string> {
  if (isProxy && proxy?.trim()) return proxy;
  const { data } = await axios.get(
    `${ENV.USER_SERVICE_BASEURL}/users/${encodeURIComponent(userID)}`,
    { headers: authHeader() },
  );
  return data.phone_number as string;
}

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
const lambda = new LambdaClient({
  region: process.env.AWS_REGION || "ap-southeast-1",
});
const NOTIF_FN = process.env.NOTIF_FN || "sendReminder";

/**
 * Send notification via AWS Lambda (Twilio/etc.)
 * Dynamically uses reminder name (plantName/action) and notes.
 */
export async function sendNotification(
  to: string,
  title: string, // reminder.name
  body?: string | null, // reminder.notes
) {
  // Ensure +65 prefix for Twilio-compatible E.164
  let formattedTo = to.trim();
  if (!formattedTo.startsWith("+")) {
    if (formattedTo.startsWith("65")) formattedTo = "+" + formattedTo;
    else formattedTo = "+65" + formattedTo;
  }

  const payload = {
    messageId: `rmdr_${Date.now()}`,
    channel: "sms",
    to: formattedTo,
    plantName: title || "Unnamed Reminder", // from reminder.name
    action: title || "Reminder", // same as name or custom later
    dueAt: new Date().toISOString(),
    tz: "Asia/Singapore",
    notes: body || "No notes provided", // from reminder.notes
  };

  console.log("📤 [sendNotification] Invoking Lambda:", NOTIF_FN);
  console.log("   → Payload:", JSON.stringify(payload, null, 2));

  try {
    const invokeRes = await lambda.send(
      new InvokeCommand({
        FunctionName: NOTIF_FN,
        InvocationType: "RequestResponse",
        Payload: Buffer.from(JSON.stringify(payload)),
      }),
    );

    const resultJson = JSON.parse(
      new TextDecoder().decode(invokeRes.Payload || new Uint8Array()),
    );

    console.log("✅ [sendNotification] Lambda result:", resultJson);
    return resultJson;
  } catch (err) {
    console.error("❌ [sendNotification] Lambda invoke failed:", err);
    throw err;
  }
}

// /** Mark reminder as sent */
// export async function markSent(reminderID: string) {
//   await axios.post(
//     `${ENV.REMINDER_SERVICE_BASEURL}/v1/reminder/${reminderID}/sent`,
//     {},
//     { headers: authHeader() }
//   );
// }
