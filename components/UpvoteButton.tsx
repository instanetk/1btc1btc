"use client";
import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useUpvote } from "@/hooks/useUpvote";
import { trackEvent } from "@/lib/analytics";
import styles from "./UpvoteButton.module.css";

interface UpvoteButtonProps {
  tokenId: bigint;
  currentUpvotes: number;
  onSuccess?: () => void;
}

export function UpvoteButton({ tokenId, currentUpvotes, onSuccess }: UpvoteButtonProps) {
  const { address, isConnected } = useAccount();
  const { upvote, hasVoted, isPending, isSuccess } = useUpvote(tokenId, address);

  const notifiedRef = useRef(false);
  useEffect(() => {
    if (isSuccess && onSuccess && !notifiedRef.current) {
      notifiedRef.current = true;
      onSuccess();
    }
  }, [isSuccess, onSuccess]);

  const voted = hasVoted === true;

  return (
    <button
      className={`${styles.button} ${voted ? styles.voted : ""}`}
      onClick={() => { trackEvent("Upvote", { tokenId: Number(tokenId) }); upvote(); }}
      disabled={!isConnected || voted || isPending}
      title={!isConnected ? "Connect wallet to upvote" : voted ? "Already voted" : "Upvote"}
    >
      <svg
        className={styles.icon}
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 2L12 8H2L7 2Z"
          fill="currentColor"
        />
      </svg>
      <span className={styles.count}>
        {isPending ? currentUpvotes + 1 : currentUpvotes}
      </span>
    </button>
  );
}
