"use client";
import { useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import styles from "./FrameShareButton.module.css";

interface FrameShareButtonProps {
  analogy: string;
}

export function FrameShareButton({ analogy }: FrameShareButtonProps) {
  const handleShare = useCallback(async () => {
    try {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://1btc1btc.money";
      await sdk.actions.composeCast({
        text: `"${analogy}"\n\n1 BTC = 1 BTC`,
        embeds: [`${siteUrl}/frame` as `https://${string}`],
      });
    } catch (err) {
      console.error("composeCast failed:", err);
    }
  }, [analogy]);

  return (
    <button className={styles.button} onClick={handleShare}>
      Share on Farcaster
    </button>
  );
}
