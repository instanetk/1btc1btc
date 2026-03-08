import { broadcastNotification } from "./send";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://1btc1btc.money";

const ABSURD_TEMPLATES = [
  { unit: "cows", compute: (btcUsd: number) => Math.round(btcUsd / 2500) },
  {
    unit: "Big Macs",
    compute: (btcUsd: number) => Math.round(btcUsd / 5.79),
  },
  {
    unit: "Costco hot dogs",
    compute: (btcUsd: number) => Math.round(btcUsd / 1.5),
  },
  {
    unit: "gallons of milk",
    compute: (btcUsd: number) => Math.round(btcUsd / 4.15),
  },
  { unit: "bananas", compute: (btcUsd: number) => Math.round(btcUsd / 0.25) },
  {
    unit: "oz of gold",
    compute: (btcUsd: number) => Math.round((btcUsd / 2650) * 10) / 10,
  },
  {
    unit: "beaver pelts",
    compute: (btcUsd: number) => Math.round(btcUsd / 2),
  },
  {
    unit: "tulip bulbs (1637)",
    compute: (btcUsd: number) => Math.round((btcUsd / 15000) * 10) / 10,
  },
  {
    unit: "Roman soldier salaries",
    compute: (btcUsd: number) => Math.round((btcUsd / 2000) * 10) / 10,
  },
  {
    unit: "copies of the whitepaper",
    compute: (btcUsd: number) => Math.round(btcUsd / 0.9),
  },
  {
    unit: "million grains of rice",
    compute: (btcUsd: number) =>
      Math.round(btcUsd / 0.0004 / 1_000_000),
  },
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
    const index = hashToIndex(weekId, ABSURD_TEMPLATES.length);
    const template = ABSURD_TEMPLATES[index];
    const value = template.compute(btcUsd);

    console.log(`[WeeklyAbsurd] This week: 1 BTC = ${value} ${template.unit}`);

    const result = await broadcastNotification({
      title: `1 BTC = ${value} ${template.unit}`,
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
