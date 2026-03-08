import {
  liveConversions,
  historicalConversions,
  absurdConversions,
  type ConversionDef,
} from "@/lib/ticker/conversions";
import { broadcastNotification } from "./send";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://1btc1btc.money";

// All conversion categories combined into one pool for weekly rotation
const ALL_CONVERSIONS: ConversionDef[] = [
  ...liveConversions,
  ...historicalConversions,
  ...absurdConversions,
];

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

// Deterministic index from week ID so the same week always picks the same unit
function hashToIndex(str: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % max;
}

function formatValue(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return Math.round(n).toLocaleString("en-US");
  if (n >= 10) return Math.round(n).toString();
  return n.toFixed(1);
}

async function getBtcPrice(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://api.coinbase.com/v2/prices/BTC-USD/spot"
    );
    const data = await response.json();
    return parseFloat(data.data.amount);
  } catch (error) {
    console.error("[WeeklyAbsurd] Price fetch error:", error);
    return null;
  }
}

export async function sendWeeklyAbsurd() {
  console.log("[WeeklyAbsurd] Starting weekly absurd notification...");

  try {
    const btcUsd = await getBtcPrice();
    if (!btcUsd) {
      console.log("[WeeklyAbsurd] Could not fetch BTC price, skipping");
      return;
    }
    console.log(`[WeeklyAbsurd] BTC/USD: $${btcUsd}`);

    const weekId = getWeekId();
    const index = hashToIndex(weekId, ALL_CONVERSIONS.length);
    const conversion = ALL_CONVERSIONS[index];
    const raw = conversion.compute(btcUsd);
    const value = formatValue(raw);

    console.log(
      `[WeeklyAbsurd] This week: 1 BTC = ${value} ${conversion.unit}`
    );

    const result = await broadcastNotification({
      title: `1 BTC = ${value} ${conversion.unit}`,
      body: "Think about it.",
      targetUrl: `${SITE_URL}/frame`,
      notificationId: `absurd-${weekId}`,
    });

    console.log(
      `[WeeklyAbsurd] Done: ${result.sent} sent, ${result.failed} failed`
    );
  } catch (error) {
    console.error("[WeeklyAbsurd] Error:", error);
  }
}
