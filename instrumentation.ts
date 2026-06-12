export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startUpvoteListener } = await import(
      "./lib/notifications/upvoteListener"
    );
    const { startNotificationScheduler } = await import(
      "./lib/notifications/scheduler"
    );
    const { startMemoryLogger } = await import("./lib/server/memoryLogger");

    startMemoryLogger();
    startUpvoteListener();
    startNotificationScheduler();
  }
}
