import * as workflow from "@temporalio/workflow";
import type * as acts from "./activities";
export declare const cancelSignal: workflow.SignalDefinition<[], "cancel">;
export interface SendReminderInput {
  reminder: acts.ReminderRow;
}
/** Sends one reminder */
export declare function SendReminderWorkflow({
  reminder,
}: SendReminderInput): Promise<void>;
/** Polls for due reminders and triggers children */
export declare function PollDueRemindersWorkflow(): Promise<void>;
//# sourceMappingURL=workflows.d.ts.map
