import { connectToDatabase } from "@/lib/mongodb";
import { Analogy } from "@/lib/models/Analogy";
import { broadcastNotification } from "./send";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://1btc1btc.money";

interface TopThought {
  tokenId: number;
  analogy: string;
  upvotes: number;
}

function getWeekId(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 +
      startOfYear.getDay() +
      1) /
      7
  );
  return `${now.getFullYear()}-W${weekNumber}`;
}

async function getTopThoughtOfWeek(): Promise<TopThought | null> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  await connectToDatabase();

  const result = await Analogy.findOne({
    minted: true,
    createdAt: { $gte: oneWeekAgo },
  })
    .sort({ upvotes: -1, tokenId: -1 })
    .lean();

  if (!result || result.tokenId == null) return null;

  return {
    tokenId: result.tokenId,
    analogy: result.text,
    upvotes: result.upvotes ?? 0,
  };
}

export async function sendWeeklyTopThought() {
  console.log("[WeeklyTopThought] Starting weekly digest...");

  try {
    const topThought = await getTopThoughtOfWeek();

    if (!topThought) {
      console.log("[WeeklyTopThought] No new mints this week, skipping");
      return;
    }

    console.log(
      `[WeeklyTopThought] Top thought: #${topThought.tokenId} with ${topThought.upvotes} upvotes`
    );

    const truncatedText =
      topThought.analogy.length > 90
        ? topThought.analogy.slice(0, 87) + "..."
        : topThought.analogy;

    const weekId = getWeekId();

    const result = await broadcastNotification({
      title: "Top thought this week",
      body: `"${truncatedText}"`,
      targetUrl: `${SITE_URL}/frame/${topThought.tokenId}`,
      notificationId: `weekly-top-${weekId}`,
    });

    console.log(
      `[WeeklyTopThought] Done: ${result.sent} sent, ${result.failed} failed`
    );
  } catch (error) {
    console.error("[WeeklyTopThought] Error:", error);
  }
}
