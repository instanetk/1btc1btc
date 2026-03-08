import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Analogy } from "@/lib/models/Analogy";
import { NotificationToken } from "@/lib/models/NotificationToken";
import { sendNotification } from "@/lib/notifications/send";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://1btc1btc.money";
const NOTIFICATION_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: Request) {
  try {
    const { tokenId } = await request.json();

    if (typeof tokenId !== "number" || !Number.isFinite(tokenId)) {
      return NextResponse.json(
        { error: "Invalid tokenId." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const result = await Analogy.findOneAndUpdate(
      { tokenId, minted: true },
      { $inc: { upvotes: 1 } },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Token not found." },
        { status: 404 }
      );
    }

    // Fire-and-forget: notify minter if they have a Farcaster notification token
    if (result.minterFid) {
      sendUpvoteNotification(
        result.minterFid as number,
        tokenId,
        result.upvotes as number
      ).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upvote sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync upvote." },
      { status: 500 }
    );
  }
}

async function sendUpvoteNotification(
  fid: number,
  tokenId: number,
  upvotes: number
) {
  const token = await NotificationToken.findOne({ fid, enabled: true }).lean();
  if (!token) return;

  // Rate limit: max 1 notification per hour per user
  if (token.lastNotifiedAt) {
    const elapsed = Date.now() - new Date(token.lastNotifiedAt).getTime();
    if (elapsed < NOTIFICATION_COOLDOWN_MS) return;
  }

  // Update lastNotifiedAt before sending (optimistic)
  await NotificationToken.updateOne({ fid }, { lastNotifiedAt: new Date() });

  await sendNotification({
    fid,
    title: "Your thought got upvoted!",
    body: `Thought #${tokenId} now has ${upvotes} ${upvotes === 1 ? "vote" : "votes"}`,
    targetUrl: `${SITE_URL}/frame`,
  });
}
