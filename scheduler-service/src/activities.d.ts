export type ReminderRow = {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  due_at: string;
  is_proxy: boolean;
  proxy: string | null;
  sent_at?: string | null;
};
/** List reminders due soon */
/** List reminders due soon */
export declare function listDueReminders(
  windowSec: number,
): Promise<ReminderRow[]>;
/** Resolve correct phone number */
export declare function resolveTargetNumber(
  userID: string,
  isProxy: boolean,
  proxy: string | null,
): Promise<string>;
/**
 * Send notification via AWS Lambda (Twilio/etc.)
 * Dynamically uses reminder name (plantName/action) and notes.
 */
export declare function sendNotification(
  to: string,
  title: string, // reminder.name
  body?: string | null,
): Promise<any>;
//# sourceMappingURL=activities.d.ts.map
