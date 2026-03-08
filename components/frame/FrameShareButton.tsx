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
      {compact ? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      ) : (
        "Share on Farcaster"
      )}
    </button>
  );
}
