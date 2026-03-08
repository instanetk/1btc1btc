"use client";
import { useAccount } from "wagmi";
import { sdk } from "@farcaster/miniapp-sdk";
import { useUpvote } from "@/hooks/useUpvote";
import styles from "./FrameUpvoteButton.module.css";

interface FrameUpvoteButtonProps {
  tokenId: number;
  currentUpvotes: number;
}

export function FrameUpvoteButton({ tokenId, currentUpvotes }: FrameUpvoteButtonProps) {
  const { address, isConnected } = useAccount();
  const { upvote, hasVoted, isPending } = useUpvote(
    BigInt(tokenId),
    address
  );

  const voted = hasVoted === true;

  const handleUpvote = () => {
    try {
      sdk.haptics.impactOccurred("light");
    } catch {
      // Haptics not available outside Farcaster client
    }
    upvote();
  };

  return (
    <button
      className={`${styles.button} ${voted ? styles.voted : ""}`}
      onClick={handleUpvote}
      disabled={!isConnected || voted || isPending}
    >
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
        <path d="M5 0L10 8H0L5 0Z" fill="currentColor" />
      </svg>
      <span className={styles.count}>
        {isPending && !voted ? currentUpvotes + 1 : currentUpvotes}
      </span>
    </button>
  );
}
