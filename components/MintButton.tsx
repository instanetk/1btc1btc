"use client";
import { useCallback, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { decodeEventLog } from "viem";
import { contractConfig, ONEBTC_ABI } from "@/lib/contract";
import { useMintPrice } from "@/hooks/useMintPrice";
import { trackEvent } from "@/lib/analytics";
import styles from "./MintButton.module.css";

interface MintButtonProps {
  analogy: string;
  analogyId?: string | null;
  onSuccess?: (txHash: string) => void;
  onConnect?: () => void;
  compact?: boolean;
}

export function MintButton({ analogy, analogyId, onSuccess, onConnect, compact }: MintButtonProps) {
  const { address, isConnected } = useAccount();
  const { priceInWei } = useMintPrice();

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleClick = useCallback(() => {
    if (!isConnected) {
      onConnect?.();
      return;
    }
    if (!priceInWei) return;
    trackEvent("Mint Start");
    // Add 2% buffer to account for price movement
    const valueWithBuffer = (priceInWei * 102n) / 100n;
    writeContract({
      ...contractConfig,
      functionName: "mint",
      args: [analogy],
      value: valueWithBuffer,
    });
  }, [isConnected, onConnect, priceInWei, analogy, writeContract]);

  // Notify parent on success (only once) and update MongoDB
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (isSuccess && txHash && onSuccess && !notifiedRef.current) {
      notifiedRef.current = true;
      onSuccess(txHash);

      // Fire-and-forget: update mint status in MongoDB
      if (analogyId && address && receipt) {
        let tokenId: number | undefined;
        try {
          for (const log of receipt.logs) {
            try {
              const decoded = decodeEventLog({
                abi: ONEBTC_ABI,
                data: log.data,
                topics: log.topics,
              });
              if (decoded.eventName === "AnalogyMinted") {
                tokenId = Number((decoded.args as { tokenId: bigint }).tokenId);
                break;
              }
            } catch {
              // Not our event, skip
            }
          }
        } catch {
          // Log parsing failed, continue without tokenId
        }

        trackEvent("Mint Success", tokenId != null ? { tokenId } : undefined);

        fetch(`/api/analogies/${analogyId}/mint`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            minterAddress: address,
            txHash,
            ...(tokenId != null ? { tokenId } : {}),
          }),
        }).catch(() => {
          // Silent failure — mint update is best-effort
        });
      }
    }
  }, [isSuccess, txHash, onSuccess, analogyId, address, receipt]);

  useEffect(() => {
    if (writeError) {
      trackEvent("Mint Fail");
    }
  }, [writeError]);

  const isPending = isWritePending || isConfirming;

  return (
    <div className={styles.wrapper}>
      <button
        className={compact ? `${styles.button} ${styles.compact}` : styles.button}
        onClick={handleClick}
        disabled={isPending || isSuccess}
      >
        {isSuccess
          ? "Minted!"
          : isPending
            ? "Minting..."
            : compact
              ? "Mint \u00b7 1000 SATS"
              : "Mint this thought \u00b7 1000 SATS"}
      </button>
      {writeError && (
        <p className={styles.error}>
          {writeError.message.includes("User rejected")
            ? "Transaction cancelled."
            : "Mint failed. Please try again."}
        </p>
      )}
    </div>
  );
}
