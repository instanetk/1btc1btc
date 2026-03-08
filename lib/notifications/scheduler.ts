import cron from "node-cron";
import { sendWeeklyTopThought } from "./weeklyTopThought";
import { sendWeeklyAbsurd } from "./weeklyAbsurd";

export function startNotificationScheduler() {
  // Weekly Top Thought: Sundays at 9:00 AM Eastern
  cron.schedule(
    "0 9 * * 0",
    async () => {
      console.log("[Scheduler] Triggering weekly top thought...");
      await sendWeeklyTopThought();
    },
    { timezone: "America/New_York" }
  );

  console.log("[Scheduler] Weekly Top Thought: Sundays 9:00 AM ET");

  // Weekly Absurd Conversion: Wednesdays at 12:00 PM Eastern
  cron.schedule(
    "0 12 * * 3",
    async () => {
      console.log("[Scheduler] Triggering weekly absurd conversion...");
      await sendWeeklyAbsurd();
    },
    { timezone: "America/New_York" }
  );

  console.log("[Scheduler] Weekly Absurd: Wednesdays 12:00 PM ET");
}
