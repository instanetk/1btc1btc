import { NextRequest, NextResponse } from "next/server";
import { sendWeeklyTopThought } from "@/lib/notifications/weeklyTopThought";
import { sendWeeklyAbsurd } from "@/lib/notifications/weeklyAbsurd";

const TRIGGER_SECRET = process.env.NOTIFICATION_TRIGGER_SECRET;

export async function POST(req: NextRequest) {
  if (!TRIGGER_SECRET) {
    return NextResponse.json(
      { error: "NOTIFICATION_TRIGGER_SECRET not configured" },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${TRIGGER_SECRET}`) {
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
