import {
  type TickerItem,
  type ConversionDef,
  liveConversions,
  historicalConversions,
  absurdConversions,
} from "./conversions";

function formatValue(n: number): string {
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1) + "M";
  }
  if (n >= 10_000) {
    return Math.round(n).toLocaleString("en-US");
  }
  if (n >= 100) {
    return Math.round(n).toLocaleString("en-US");
  }
  if (n >= 10) {
    return n.toFixed(1);
  }
  if (n >= 1) {
    return n.toFixed(1);
  }
  return n.toFixed(2);
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function computeItem(def: ConversionDef, btcUsd: number): TickerItem {
  const raw = def.compute(btcUsd);
  return {
    value: formatValue(raw),
    unit: def.unit,
    tooltip: def.tooltip,
    category: def.category,
  };
}

const PUNCHLINE_ITEM: TickerItem = {
  value: "1",
  unit: "BTC",
  tooltip: "",
  category: "punchline",
};

export function buildTickerItems(btcUsd: number): TickerItem[] {
  const live = shuffleArray(liveConversions).map((d) =>
    computeItem(d, btcUsd)
  );
  const historical = shuffleArray(historicalConversions).map((d) =>
    computeItem(d, btcUsd)
  );
  const absurd = shuffleArray(absurdConversions).map((d) =>
    computeItem(d, btcUsd)
  );

  // Round-robin interleave from all 3 categories
  const interleaved: TickerItem[] = [];
  const maxLen = Math.max(live.length, historical.length, absurd.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < live.length) interleaved.push(live[i]);
    if (i < historical.length) interleaved.push(historical[i]);
    if (i < absurd.length) interleaved.push(absurd[i]);
  }

  // Insert "1 BTC = 1 BTC" punchline every ~6 items
  const result: TickerItem[] = [];
  for (let i = 0; i < interleaved.length; i++) {
    if (i > 0 && i % 6 === 0) {
      result.push(PUNCHLINE_ITEM);
    }
    result.push(interleaved[i]);
  }

  return result;
}
