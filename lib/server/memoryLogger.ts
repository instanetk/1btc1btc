// Lightweight periodic memory logger. Logs process RSS/heap so we can see whether
// memory climbs steadily (leak) or spikes with traffic. Cheap enough to leave on.
export function startMemoryLogger(intervalMs = 5 * 60_000) {
  const mb = (n: number) => Math.round(n / 1024 / 1024);

  const log = () => {
    const m = process.memoryUsage();
    console.log(
      `[Memory] rss=${mb(m.rss)}MB heapUsed=${mb(m.heapUsed)}MB ` +
        `heapTotal=${mb(m.heapTotal)}MB external=${mb(m.external)}MB ` +
        `arrayBuffers=${mb(m.arrayBuffers)}MB`
    );
  };

  log();
  const timer = setInterval(log, intervalMs);
  // Don't keep the event loop alive solely for logging.
  if (typeof timer.unref === "function") timer.unref();
}
