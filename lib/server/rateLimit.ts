import { connectToDatabase } from "@/lib/mongodb";
import { RateLimit } from "@/lib/models/RateLimit";

/**
 * Atomic fixed-window rate limit backed by MongoDB (shared across instances).
 * Returns true if the request is allowed, false if the limit is exceeded.
 *
 * Uses an atomic upsert+$inc so concurrent requests can't race past the cap.
 */
export async function checkRateLimit(
  scope: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const windowStart = Math.floor(Date.now() / windowMs);
  const key = `${scope}:${windowStart}`;
  const expiresAt = new Date((windowStart + 1) * windowMs);

  await connectToDatabase();

  const doc = await RateLimit.findOneAndUpdate(
    { key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, new: true }
  ).lean();

  return (doc?.count ?? 0) <= limit;
}

/**
 * Extract the client IP, ignoring client-supplied forwarded headers where possible.
 * On Vercel, `x-real-ip` is set by the platform and is not spoofable by the client,
 * so prefer it over `x-forwarded-for` (whose leftmost entry the client controls).
 */
export function getClientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Fallback: take the LAST hop of x-forwarded-for (appended by the trusted proxy),
  // not the client-controlled leftmost entry.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }

  return "unknown";
}
