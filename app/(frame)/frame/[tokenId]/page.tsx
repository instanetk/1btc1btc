import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://1btc1btc.money";

type Props = { params: Promise<{ tokenId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tokenId } = await params;

  const miniAppEmbed = JSON.stringify({
    version: "1",
    imageUrl: `${SITE_URL}/api/og/feed/${tokenId}`,
    button: {
      title: "View Thought",
      action: {
        type: "launch_frame",
        name: "1BTC1BTC",
        url: `${SITE_URL}/frame`,
        splashImageUrl: `${SITE_URL}/splash.png`,
        splashBackgroundColor: "#0A0A0A",
      },
    },
  });

  return {
    title: `1BTC1BTC - Thought #${tokenId}`,
    description:
      "A Bitcoin zen koan minted as an onchain SVG NFT on Base.",
    other: {
      "fc:miniapp": miniAppEmbed,
    },
  };
}

// Re-export the main frame page — same Mini App UI, different metadata
export { default } from "../page";
