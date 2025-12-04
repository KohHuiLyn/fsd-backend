import * as activities from "./activities.js";
import { ENV } from "./env.js";

/**
 * Process a single reminder: resolve phone number and send notification
 */
async function processReminder(reminder: activities.ReminderRow): Promise<void> {
  try {
    console.log(`📋 Processing reminder: ${reminder.id} - ${reminder.name}`);
    
    // Resolve the target phone number
    const phone = await activities.resolveTargetNumber(
      reminder.user_id,
      reminder.is_proxy,
      reminder.proxy,
    );

    // Send the notification
    await activities.sendNotification(
      phone,
      reminder.name ?? "Reminder",
      reminder.notes,
    );

    console.log(`✅ Successfully processed reminder: ${reminder.id}`);
  } catch (error) {
    console.error(`❌ Failed to process reminder ${reminder.id}:`, error);
    // Continue processing other reminders even if one fails
  }
}

/**
 * Poll for due reminders and process them
 */
export async function pollAndProcessReminders(): Promise<void> {
  try {
    console.log("🕒 Polling for due reminders...");
    
    const reminders = await activities.listDueReminders(ENV.DUE_WINDOW_SEC);

    if (reminders.length === 0) {
      console.log("   → No reminders due at this time.");
      return;
    }

    console.log(`   → Found ${reminders.length} reminder(s) to process.`);

    // Process reminders in parallel (with some concurrency control)
    // Using Promise.allSettled to ensure all reminders are attempted
    // even if some fail
    const results = await Promise.allSettled(
      reminders.map((reminder) => processReminder(reminder))
    );

    // Log summary
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `📊 Reminder processing complete: ${succeeded} succeeded, ${failed} failed`
    );
  } catch (error) {
    console.error("❌ Error in pollAndProcessReminders:", error);
    // Don't throw - allow the cron job to continue running
  }
}

