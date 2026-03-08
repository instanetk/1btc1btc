import { NextResponse } from "next/server";
import {
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
  type ParseWebhookEvent,
} from "@farcaster/miniapp-node";
import { connectToDatabase } from "@/lib/mongodb";
import { NotificationToken } from "@/lib/models/NotificationToken";

// Rate limiting: 60 requests per minute per IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (valid.length >= RATE_LIMIT_MAX) {
    return true;
  }

  valid.push(now);
  rateLimitMap.set(ip, valid);

  // Clean old entries periodically
  if (rateLimitMap.size > 10000) {
    const cutoff = now - RATE_LIMIT_WINDOW_MS;
    for (const [key, ts] of rateLimitMap) {
      if (ts.every((t) => t < cutoff)) rateLimitMap.delete(key);
    }
  }

  return false;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded." },
      { status: 429 }
    );
  }

  let data;
  try {
    const body = await request.json();
    data = await parseWebhookEvent(body, verifyAppKeyWithNeynar);
  } catch (e: unknown) {
    const error = e as ParseWebhookEvent.ErrorType;

    switch (error.name) {
      case "VerifyJsonFarcasterSignature.InvalidDataError":
      case "VerifyJsonFarcasterSignature.InvalidEventDataError":
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 401 }
        );
      case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
    }

    console.error("Webhook verification error:", e);
    return NextResponse.json(
      { success: false, error: "Verification failed." },
      { status: 500 }
    );
  }

  const { fid, event } = data;

  try {
    await connectToDatabase();

    switch (event.event) {
      case "miniapp_added": {
        if (event.notificationDetails) {
          await NotificationToken.findOneAndUpdate(
            { fid },
            {
              token: event.notificationDetails.token,
              notificationUrl: event.notificationDetails.url,
              enabled: true,
            },
            { upsert: true }
          );
        }
        break;
      }

      case "miniapp_removed": {
        await NotificationToken.deleteOne({ fid });
        break;
      }

      case "notifications_enabled": {
        await NotificationToken.findOneAndUpdate(
          { fid },
          {
            token: event.notificationDetails.token,
            notificationUrl: event.notificationDetails.url,
            enabled: true,
          },
          { upsert: true }
        );
        break;
      }

      case "notifications_disabled": {
        await NotificationToken.updateOne({ fid }, { enabled: false });
        break;
      }
    }
  } catch (dbError) {
    console.error("Webhook DB error:", dbError);
    return NextResponse.json(
      { success: false, error: "Internal error." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
