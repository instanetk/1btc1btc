import { timingSafeEqual } from "crypto";

/** Constant-time string comparison (avoids leaking the secret via timing). */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Returns true if the request carries `Authorization: Bearer <secret>`. */
export function bearerAuthorized(authHeader: string | null, secret: string): boolean {
  return safeEqual(authHeader ?? "", `Bearer ${secret}`);
}
