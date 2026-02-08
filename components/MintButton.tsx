"use client";
import { useCallback, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractConfig } from "@/lib/contract";
import { useMintPrice } from "@/hooks/useMintPrice";
import styles from "./MintButton.module.css";

interface MintButtonProps {
  analogy: string;
  onSuccess?: (txHash: string) => void;
  onConnect?: () => void;
}

export function MintButton({ analogy, onSuccess, onConnect }: MintButtonProps) {
  const { isConnected } = useAccount();
  const { priceInWei, priceInETH, isLoading: priceLoading } = useMintPrice();

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleClick = useCallback(() => {
    if (!isConnected) {
      onConnect?.();
      return;
    }
    if (!priceInWei) return;
    // Add 2% buffer to account for price movement
    const valueWithBuffer = (priceInWei * 102n) / 100n;
    writeContract({
      ...contractConfig,
      functionName: "mint",
      args: [analogy],
      value: valueWithBuffer,
    });
  }, [isConnected, onConnect, priceInWei, analogy, writeContract]);

  // Notify parent on success (only once)
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (isSuccess && txHash && onSuccess && !notifiedRef.current) {
      notifiedRef.current = true;
      onSuccess(txHash);
    }
  }, [isSuccess, txHash, onSuccess]);

  const isPending = isWritePending || isConfirming;

  return (
    <div>
      <button
        className={styles.button}
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending
          ? "Minting..."
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
