import { NextRequest, NextResponse } from "next/server";
import { bearerAuthorized } from "@/lib/server/auth";
import { syncChain, fullReconcile } from "@/lib/notifications/chainSync";

// Allow long-running full reconciles.
export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (!bearerAuthorized(req.headers.get("authorization"), CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { full } = await req.json().catch(() => ({ full: false }));

  try {
    if (full === true) {
      const result = await fullReconcile();
      return NextResponse.json({ ok: true, mode: "full", ...result });
    }
    await syncChain();
    return NextResponse.json({ ok: true, mode: "incremental" });
  } catch (error) {
    console.error("Cron sync error:", error);
    return NextResponse.json({ error: "Sync failed." }, { status: 500 });
  }
}
