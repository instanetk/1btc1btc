"use client";
import { useEffect, useRef } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractConfig } from "@/lib/contract";

export function useUpvote(tokenId: bigint, voterAddress?: `0x${string}`) {
  const { data: hasVoted, refetch: refetchVoted } = useReadContract({
    ...contractConfig,
    functionName: "hasVoted",
    args: voterAddress ? [tokenId, voterAddress] : undefined,
    query: {
      enabled: !!voterAddress,
    },
  });

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const upvote = () => {
    writeContract({
      ...contractConfig,
      functionName: "upvote",
      args: [tokenId],
    });
  };

  // Refetch voted status and sync upvote to MongoDB after successful tx
  const prevSuccess = useRef(false);
  useEffect(() => {
    if (isSuccess && !prevSuccess.current) {
      prevSuccess.current = true;
      refetchVoted();
      // Fire-and-forget: sync upvote count to MongoDB
      fetch("/api/gallery/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: Number(tokenId) }),
      }).catch(() => {});
    }
  }, [isSuccess, refetchVoted, tokenId]);

  return {
    upvote,
    hasVoted: hasVoted as boolean | undefined,
    isPending: isWritePending || isConfirming,
    isSuccess,
    error: writeError,
  };
}
