import type { Metadata } from "next";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { ONEBTC_ABI } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import NftPageClient from "./NftPageClient";

const client = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

interface Props {
  params: Promise<{ tokenId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tokenId } = await params;

  try {
    const uri = (await client.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: ONEBTC_ABI,
      functionName: "tokenURI",
      args: [BigInt(tokenId)],
    })) as string;

    const json = JSON.parse(atob(uri.split(",")[1]));
    const description: string = json.description ?? json.name ?? "";

    return {
      title: `1BTC1BTC #${tokenId}`,
      description,
      openGraph: {
        title: `1BTC1BTC #${tokenId}`,
        description,
        images: [{ url: `/api/og/${tokenId}`, width: 1200, height: 1200 }],
      },
      twitter: {
        card: "summary_large_image",
        title: `1BTC1BTC #${tokenId}`,
        description,
        images: [{ url: `/api/og/${tokenId}`, alt: description }],
      },
    };
  } catch {
    return { title: `1BTC1BTC #${tokenId}` };
  }
}

export default async function NftPage({ params }: Props) {
  const { tokenId } = await params;
  return <NftPageClient tokenId={tokenId} />;
}
