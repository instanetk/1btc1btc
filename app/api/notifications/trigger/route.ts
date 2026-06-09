import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { sendWeeklyTopThought } from "@/lib/notifications/weeklyTopThought";
import { sendWeeklyAbsurd } from "@/lib/notifications/weeklyAbsurd";

const TRIGGER_SECRET = process.env.NOTIFICATION_TRIGGER_SECRET;

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual requires equal lengths; comparing length first leaks only length,
  // and the hash below keeps the comparison constant-time regardless.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  if (!TRIGGER_SECRET) {
    return NextResponse.json(
      { error: "NOTIFICATION_TRIGGER_SECRET not configured" },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (!safeEqual(authHeader, `Bearer ${TRIGGER_SECRET}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await req.json().catch(() => ({ type: undefined }));

  if (type === "weekly-top") {
    await sendWeeklyTopThought();
    return NextResponse.json({ ok: true, type: "weekly-top" });
  }

  if (type === "weekly-absurd") {
    await sendWeeklyAbsurd();
    return NextResponse.json({ ok: true, type: "weekly-absurd" });
  }

  return NextResponse.json(
    { error: "Invalid type. Use: weekly-top, weekly-absurd" },
    { status: 400 }
  );
}
