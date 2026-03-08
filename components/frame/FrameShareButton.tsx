"use client";
import { useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import styles from "./FrameShareButton.module.css";

interface FrameShareButtonProps {
  analogy: string;
  tokenId?: number;
  compact?: boolean;
}

export function FrameShareButton({ analogy, tokenId, compact }: FrameShareButtonProps) {
  const handleShare = useCallback(async () => {
    try {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://1btc1btc.money";
      const embedUrl = tokenId
        ? `${siteUrl}/frame/${tokenId}`
        : `${siteUrl}/frame`;
      await sdk.actions.composeCast({
        text: `"${analogy}"\n\n1 BTC = 1 BTC`,
        embeds: [embedUrl as `https://${string}`],
      });
    } catch (err) {
      console.error("composeCast failed:", err);
    }
  }, [analogy, tokenId]);

  return (
    <button className={`${styles.button} ${compact ? styles.compact : ""}`} onClick={handleShare}>
      {compact ? "Cast" : "Share on Farcaster"}
    </button>
  );
}
