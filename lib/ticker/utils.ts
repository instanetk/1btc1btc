import {
  type TickerItem,
  type ConversionDef,
  type CommodityPrices,
  liveConversions,
  historicalConversions,
  absurdConversions,
} from "./conversions";

function formatValue(n: number): string {
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(2) + "M";
  }
  if (n >= 10_000) {
    return n.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  if (n >= 100) {
    return n.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  if (n >= 10) {
    return n.toFixed(2);
  }
  if (n >= 1) {
    return n.toFixed(2);
  }
  return n.toFixed(3);
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function computeItem(def: ConversionDef, prices: CommodityPrices): TickerItem {
  const raw = def.compute(prices.btcUsd, prices);
  return {
    id: def.id,
    value: formatValue(raw),
    unit: def.unit,
    tooltip: def.tooltip,
    category: def.category,
  };
}

const PUNCHLINE_ITEM: TickerItem = {
  id: "punchline",
  value: "1",
  unit: "BTC",
  tooltip: "",
  category: "punchline",
};

export interface LatestNft {
  tokenId: number;
  minterAddress: string;
  text: string;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Shuffle order once at server startup, reuse on every request
const shuffledLive = shuffleArray(liveConversions);
const shuffledHistorical = shuffleArray(historicalConversions);
const shuffledAbsurd = shuffleArray(absurdConversions);

export function buildTickerItems(prices: CommodityPrices, latestNft?: LatestNft | null): TickerItem[] {
  const live = shuffledLive.map((d) =>
    computeItem(d, prices)
  );
  const historical = shuffledHistorical.map((d) =>
    computeItem(d, prices)
  );
  const absurd = shuffledAbsurd.map((d) =>
    computeItem(d, prices)
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
  let punchlineCount = 0;
  const result: TickerItem[] = [];
  for (let i = 0; i < interleaved.length; i++) {
    if (i > 0 && i % 6 === 0) {
      result.push({ ...PUNCHLINE_ITEM, id: `punchline-${punchlineCount++}` });
    }
    result.push(interleaved[i]);
  }

  if (latestNft) {
    const nftBase: TickerItem = {
      id: "nft",
      value: `#${latestNft.tokenId}`,
      unit: `minted by ${truncateAddress(latestNft.minterAddress)}`,
      tooltip: latestNft.text,
      category: "nft",
      href: `/nft/${latestNft.tokenId}`,
    };
    // Insert every 15 items
    let nftCount = 0;
    for (let i = 2; i < result.length; i += 16) {
      result.splice(i, 0, { ...nftBase, id: `nft-${nftCount++}` });
    }
  }

  return result;
}
