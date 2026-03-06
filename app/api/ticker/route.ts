import { NextResponse } from "next/server";
import { buildTickerItems, type LatestNft } from "@/lib/ticker/utils";
import { type CommodityPrices } from "@/lib/ticker/conversions";
import { connectToDatabase } from "@/lib/mongodb";
import { Analogy } from "@/lib/models/Analogy";

const FALLBACK_BTC_USD = 97000;
const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,xau,xag";

async function fetchPrices(): Promise<CommodityPrices> {
  try {
    const res = await fetch(COINGECKO_URL, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();
    const usd = data?.bitcoin?.usd;
    const xau = data?.bitcoin?.xau;
    const xag = data?.bitcoin?.xag;
    if (typeof usd !== "number" || usd <= 0) {
      throw new Error("Invalid price data");
    }
    return {
      btcUsd: usd,
      btcGoldOz: typeof xau === "number" && xau > 0 ? xau : usd / 2400,
      btcSilverOz: typeof xag === "number" && xag > 0 ? xag : usd / 32,
    };
  } catch (error) {
    console.error("Price fetch failed, using fallbacks:", error);
    return {
      btcUsd: FALLBACK_BTC_USD,
      btcGoldOz: FALLBACK_BTC_USD / 2400,
      btcSilverOz: FALLBACK_BTC_USD / 32,
    };
  }
}

async function fetchLatestNft(): Promise<LatestNft | null> {
  try {
    await connectToDatabase();
    const latest = await Analogy.findOne({ minted: true })
      .sort({ tokenId: -1 })
      .select("tokenId minterAddress text")
      .lean();

    if (!latest || !latest.tokenId || !latest.minterAddress) return null;

    return {
      tokenId: latest.tokenId,
      minterAddress: latest.minterAddress,
      text: latest.text,
    };
  } catch (error) {
    console.error("Failed to fetch latest NFT for ticker:", error);
    return null;
  }
}

export async function GET() {
  try {
    const [prices, latestNft] = await Promise.all([
      fetchPrices(),
      fetchLatestNft(),
    ]);
    const items = buildTickerItems(prices, latestNft);

    return NextResponse.json(
      { items, btcUsd: prices.btcUsd },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Ticker API error:", error);
    return NextResponse.json({ items: [], btcUsd: 0 }, { status: 500 });
  }
}
