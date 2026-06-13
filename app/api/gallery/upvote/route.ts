import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Analogy } from "@/lib/models/Analogy";
import { NotificationToken } from "@/lib/models/NotificationToken";
import { sendNotification } from "@/lib/notifications/send";
import { ONEBTC_ABI } from "@/lib/contract";
import { getChainClient, CONTRACT_ADDRESS } from "@/lib/server/chainClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://1btc1btc.money";
const NOTIFICATION_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: Request) {
  try {
    const { tokenId } = await request.json();

    if (typeof tokenId !== "number" || !Number.isInteger(tokenId) || tokenId < 0) {
      return NextResponse.json({ error: "Invalid tokenId." }, { status: 400 });
    }

    await connectToDatabase();

    // Read the authoritative upvote count from the contract. The Mongo field is only ever
    // SET to the on-chain value — never incremented from a client request — so replaying
    // this endpoint cannot inflate a token's ranking past its real on-chain vote count.
    let onChainVotes: number;
    try {
      const raw = await getChainClient().readContract({
        address: CONTRACT_ADDRESS,
        abi: ONEBTC_ABI,
        functionName: "upvotes",
        args: [BigInt(tokenId)],
      });
      onChainVotes = Number(raw);
    } catch {
      return NextResponse.json(
        { error: "Failed to read on-chain upvotes." },
        { status: 502 }
      );
    }

    const existing = await Analogy.findOne({ tokenId, minted: true }).lean();
    if (!existing) {
      return NextResponse.json({ error: "Token not found." }, { status: 404 });
    }

    const prevVotes = existing.upvotes ?? 0;
    if (onChainVotes <= prevVotes) {
      // Nothing new (or already in sync) — no write, no notification.
      return NextResponse.json({ success: true, upvotes: prevVotes });
    }

    await Analogy.updateOne({ tokenId }, { $set: { upvotes: onChainVotes } });

    // Fire-and-forget: notify minter if they have a Farcaster notification token.
    if (existing.minterFid) {
      sendUpvoteNotification(
        existing.minterFid as number,
        tokenId,
        onChainVotes
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, upvotes: onChainVotes });
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
