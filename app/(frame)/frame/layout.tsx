import type { Metadata } from "next";
import { FrameProviders } from "@/components/frame/FrameProviders";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://1btc1btc.money";

const miniAppEmbed = JSON.stringify({
  version: "1",
  imageUrl: `${SITE_URL}/frame-og.png`,
  button: {
    title: "Generate a Thought",
    action: {
      type: "launch_frame",
      name: "1BTC1BTC",
      url: `${SITE_URL}/frame`,
      splashImageUrl: `${SITE_URL}/splash.png`,
      splashBackgroundColor: "#0A0A0A",
    },
  },
});

export const metadata: Metadata = {
  title: "1BTC1BTC - Mini App",
  description:
    "Generate Bitcoin zen koans and mint them as onchain SVG NFTs on Base.",
  other: {
    "fc:miniapp": miniAppEmbed,
  },
};

export default function FrameLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <FrameProviders>{children}</FrameProviders>;
}
