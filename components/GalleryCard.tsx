"use client";
import { useState } from "react";
import { Identity, Name, Avatar } from "@coinbase/onchainkit/identity";
import { base } from "wagmi/chains";
import { trackEvent } from "@/lib/analytics";
import { UpvoteButton } from "./UpvoteButton";
import { NftModal } from "./NftModal";
import type { GalleryItem } from "@/hooks/useGallery";
import styles from "./GalleryCard.module.css";

interface GalleryCardProps {
  item: GalleryItem;
  onUpvoteSuccess?: () => void;
}

export function GalleryCard({ item, onUpvoteSuccess }: GalleryCardProps) {
  const [showNft, setShowNft] = useState(false);

  return (
    <>
      <div className={styles.card} onClick={() => { trackEvent("NFT Modal Open", { tokenId: Number(item.tokenId) }); setShowNft(true); }}>
        <p className={styles.analogy}>{item.analogy}</p>
        <div className={styles.footer}>
          <div className={styles.identity}>
            <Identity
              address={item.minter}
              chain={base}
              schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
            >
              <Avatar className={styles.avatar} />
              <Name className={styles.name} />
            </Identity>
            <span className={styles.mintNumber}>#{item.tokenId.toString()}</span>
          </div>
          <UpvoteButton
            tokenId={item.tokenId}
            currentUpvotes={item.upvotes}
            onSuccess={onUpvoteSuccess}
          />
        </div>
      </div>
      {showNft && (
        <NftModal item={item} onUpvoteSuccess={onUpvoteSuccess} onClose={() => setShowNft(false)} />
      )}
    </>
  );
}
