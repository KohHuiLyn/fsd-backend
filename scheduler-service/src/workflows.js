import * as workflow from "@temporalio/workflow";
import {
  proxyActivities,
  sleep,
  defineSignal,
  setHandler,
} from "@temporalio/workflow";
const {
  listDueReminders,
  resolveTargetNumber,
  sendNotification,
  // markSent,
} = proxyActivities({
  startToCloseTimeout: "2 minutes",
  retry: { initialInterval: "2s", maximumAttempts: 5 },
});
export const cancelSignal = defineSignal("cancel");
/** Sends one reminder */
export async function SendReminderWorkflow({ reminder }) {
  let cancelled = false;
  setHandler(cancelSignal, () => {
    cancelled = true;
  });
  if (cancelled) return;
  const phone = await resolveTargetNumber(
    reminder.user_id,
    reminder.is_proxy,
    reminder.proxy,
  );
  if (cancelled) return;
  await sendNotification(phone, reminder.name ?? "Reminder", reminder.notes);
  // await markSent(reminder.id);
}
/** Polls for due reminders and triggers children */
export async function PollDueRemindersWorkflow() {
  let cancelled = false;
  setHandler(cancelSignal, () => {
    cancelled = true;
  });
  while (!cancelled) {
    try {
      const reminders = await listDueReminders(60);
      for (const r of reminders) {
        const workflowId = `send-${r.id}`;
        // Start a child workflow per reminder (non-blocking)
        // @ts-ignore
        await workflow.startChild(SendReminderWorkflow, {
          workflowId,
          args: [{ reminder: r }],
          cancellationSignal: cancelSignal,
        });
      }
    } catch (e) {
      console.error("Workflow polling error:", e);
    }
    await sleep(30000);
  }
}
//# sourceMappingURL=workflows.js.map
