"use client";
import { Identity, Name, Avatar } from "@coinbase/onchainkit/identity";
import { base } from "wagmi/chains";
import { UpvoteButton } from "./UpvoteButton";
import type { GalleryItem } from "@/hooks/useGallery";
import styles from "./GalleryCard.module.css";

interface GalleryCardProps {
  item: GalleryItem;
  onUpvoteSuccess?: () => void;
}

export function GalleryCard({ item, onUpvoteSuccess }: GalleryCardProps) {
  return (
    <div className={styles.card}>
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
  );
}
