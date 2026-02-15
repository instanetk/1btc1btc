"use client";
import { useReadContract } from "wagmi";
import { Identity, Name, Avatar } from "@coinbase/onchainkit/identity";
import { base } from "wagmi/chains";
import { contractConfig } from "@/lib/contract";
import { CONTRACT_ADDRESS, CHAIN } from "@/lib/constants";
import { UpvoteButton } from "./UpvoteButton";
import type { GalleryItem } from "@/hooks/useGallery";
import styles from "./NftModal.module.css";

interface NftModalProps {
  item: GalleryItem;
  onUpvoteSuccess?: () => void;
  onClose: () => void;
}

function getOpenSeaUrl(tokenId: bigint): string {
  const isTestnet = CHAIN.id !== 8453;
  const base = isTestnet
    ? "https://testnets.opensea.io/assets/base-sepolia"
    : "https://opensea.io/assets/base";
  return `${base}/${CONTRACT_ADDRESS}/${tokenId.toString()}`;
}

export function NftModal({ item, onUpvoteSuccess, onClose }: NftModalProps) {
  const { data, isLoading } = useReadContract({
    ...contractConfig,
    functionName: "tokenURI",
    args: [item.tokenId],
  });

  let imageUri: string | null = null;
  if (data) {
    try {
      const json = JSON.parse(atob((data as string).split(",")[1]));
      imageUri = json.image;
    } catch {
      // malformed tokenURI
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>1BTC1BTC #{item.tokenId.toString()}</span>
          <button className={styles.close} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.imageContainer}>
          {isLoading ? (
            <div className={styles.spinner} />
          ) : imageUri ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className={styles.nftImage}
              src={imageUri}
              alt={`NFT #${item.tokenId.toString()}`}
            />
          ) : (
            <span>Failed to load NFT</span>
          )}
        </div>
        <div className={styles.meta}>
          <div className={styles.minter}>
            <Identity
              address={item.minter}
              chain={base}
              schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
            >
              <Avatar className={styles.avatar} />
              <Name className={styles.name} />
            </Identity>
          </div>
          <div className={styles.actions}>
            <UpvoteButton
              tokenId={item.tokenId}
              currentUpvotes={item.upvotes}
              onSuccess={onUpvoteSuccess}
            />
            <a
              className={styles.buyButton}
              href={getOpenSeaUrl(item.tokenId)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Buy
            </a>
            <button
              className={styles.shareButton}
              onClick={(e) => {
                e.stopPropagation();
                const url = `${window.location.origin}/nft/${item.tokenId.toString()}`;
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
      </div>
    </div>
  );
}
