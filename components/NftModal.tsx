"use client";
import { useReadContract } from "wagmi";
import { contractConfig } from "@/lib/contract";
import styles from "./NftModal.module.css";

interface NftModalProps {
  tokenId: bigint;
  onClose: () => void;
}

export function NftModal({ tokenId, onClose }: NftModalProps) {
  const { data, isLoading } = useReadContract({
    ...contractConfig,
    functionName: "tokenURI",
    args: [tokenId],
  });

  let imageUri: string | null = null;
  if (data) {
    try {
      const json = JSON.parse(atob((data as string).split(",")[1]));
      imageUri = json.image;
    } catch {
      // malformed tokenURI
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>#{tokenId.toString()}</span>
          <button className={styles.close} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.imageContainer}>
          {isLoading ? (
            <div className={styles.spinner} />
          ) : imageUri ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className={styles.nftImage}
              src={imageUri}
              alt={`NFT #${tokenId.toString()}`}
            />
          ) : (
            <span>Failed to load NFT</span>
          )}
        </div>
      </div>
    </div>
  );
}
