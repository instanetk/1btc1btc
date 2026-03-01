"use client";
import { MintButton } from "./MintButton";
import styles from "./GeneratedCard.module.css";

interface GeneratedAnalogy {
  _id: string;
  text: string;
  domain: string;
}

interface GeneratedCardProps {
  analogy: GeneratedAnalogy;
  minted: boolean;
  onMintSuccess: () => void;
  onConnect: () => void;
}

export function GeneratedCard({ analogy, minted, onMintSuccess, onConnect }: GeneratedCardProps) {
  return (
    <div className={`${styles.card} ${minted ? styles.minted : ""}`}>
      <p className={styles.analogy}>{analogy.text}</p>
      <div className={styles.footer}>
        <span className={styles.domain}>{analogy.domain}</span>
        <MintButton
          analogy={analogy.text}
          analogyId={analogy._id}
          onSuccess={() => onMintSuccess()}
          onConnect={onConnect}
          compact
        />
      </div>
      {minted && (
        <div className={styles.mintedOverlay}>
          <span className={styles.mintedBadge}>Minted!</span>
        </div>
      )}
    </div>
  );
}
