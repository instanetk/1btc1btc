import { NextResponse } from "next/server";
import { buildTickerItems } from "@/lib/ticker/utils";

const FALLBACK_BTC_USD = 97000;
const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";

async function fetchBtcPrice(): Promise<number> {
  try {
    const res = await fetch(COINGECKO_URL, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();
    const price = data?.bitcoin?.usd;
    if (typeof price !== "number" || price <= 0) {
      throw new Error("Invalid price data");
    }
    return price;
  } catch (error) {
    console.error("BTC price fetch failed, using fallback:", error);
    return FALLBACK_BTC_USD;
  }
}

export async function GET() {
  try {
    const btcUsd = await fetchBtcPrice();
    const items = buildTickerItems(btcUsd);

    return NextResponse.json(
      { items, btcUsd },
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
