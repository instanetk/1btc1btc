"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { Identity, Name, Avatar } from "@coinbase/onchainkit/identity";
import { base } from "wagmi/chains";
import { contractConfig } from "@/lib/contract";
import { CONTRACT_ADDRESS, CHAIN } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";
import { ConnectButton } from "@/components/ConnectButton";
import { WalletModal } from "@/components/WalletModal";
import { UpvoteButton } from "@/components/UpvoteButton";
import { OrbitalBackground } from "@/components/OrbitalBackground";
import { ProgressBar } from "@/components/ProgressBar";
import { InfoSidebar } from "@/components/InfoSidebar";
import styles from "./NftPage.module.css";

function getOpenSeaUrl(tokenId: bigint): string {
  const isTestnet = CHAIN.id !== 8453;
  const baseUrl = isTestnet
    ? "https://testnets.opensea.io/assets/base-sepolia"
    : "https://opensea.io/assets/base";
  return `${baseUrl}/${CONTRACT_ADDRESS}/${tokenId.toString()}`;
}

export default function NftPageClient({ tokenId }: { tokenId: string }) {
  const id = BigInt(tokenId);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const openWalletModal = useCallback(() => setWalletModalOpen(true), []);
  const closeWalletModal = useCallback(() => setWalletModalOpen(false), []);

  const { data, isLoading } = useReadContract({
    ...contractConfig,
    functionName: "tokenURI",
    args: [id],
  });

  const { data: owner } = useReadContract({
    ...contractConfig,
    functionName: "ownerOf",
    args: [id],
  });

  const { data: upvoteCount } = useReadContract({
    ...contractConfig,
    functionName: "upvotes",
    args: [id],
  });

  let imageUri: string | null = null;
  let analogy: string | null = null;
  if (data) {
    try {
      const json = JSON.parse(atob((data as string).split(",")[1]));
      imageUri = json.image;
      analogy = json.description ?? null;
    } catch {
      // malformed tokenURI
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.orbitalFaint}>
        <OrbitalBackground />
      </div>
      <ProgressBar />
      <InfoSidebar />

      <header className={styles.header}>
        <ConnectButton onConnect={openWalletModal} />
      </header>

      <WalletModal isOpen={walletModalOpen} onClose={closeWalletModal} />

      <div className={styles.container}>
        <h1 className={styles.title}>1BTC1BTC #{tokenId}</h1>
        <div className={styles.imageContainer}>
          {isLoading ? (
            <div className={styles.spinner} />
          ) : imageUri ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className={styles.nftImage}
              src={imageUri}
              alt={analogy ?? `NFT #${tokenId}`}
            />
          ) : (
            <span className={styles.error}>Failed to load NFT</span>
          )}
        </div>

        <div className={styles.meta}>
          <div className={styles.owner}>
            {owner && (
              <Identity
                address={owner as `0x${string}`}
                chain={base}
                schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
              >
                <Avatar className={styles.avatar} />
                <Name className={styles.name} />
              </Identity>
            )}
          </div>
          <div className={styles.actions}>
            <UpvoteButton
              tokenId={id}
              currentUpvotes={Number(upvoteCount ?? 0n)}
            />
            <a
              className={styles.buyButton}
              href={getOpenSeaUrl(id)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("Buy Link", { tokenId: Number(id) })}
            >
              Buy
            </a>
            <button
              className={styles.shareButton}
              onClick={() => {
                trackEvent("Share", { tokenId: Number(id) });
                const url = `${window.location.origin}/nft/${tokenId}`;
                const text = `1 BTC = 1 BTC ₿`;
                window.open(
                  `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
            >
              Share
            </button>
          </div>
        </div>

        <Link className={styles.cta} href="/">
          Generate Your Own Thought
        </Link>
      </div>
    </main>
  );
}
