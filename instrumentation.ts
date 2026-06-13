export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startChainSync } = await import("./lib/notifications/chainSync");
    const { startNotificationScheduler } = await import(
      "./lib/notifications/scheduler"
    );
    const { startMemoryLogger } = await import("./lib/server/memoryLogger");

    startMemoryLogger();
    startChainSync();
    startNotificationScheduler();
  }
}
