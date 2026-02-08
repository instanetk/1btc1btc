"use client";
import styles from "./AnalogyDisplay.module.css";

interface AnalogyDisplayProps {
  analogy: string | null;
  isLoading: boolean;
}

export function AnalogyDisplay({ analogy, isLoading }: AnalogyDisplayProps) {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={analogy ? styles.analogy : styles.placeholder}>
        {analogy ?? "A thought awaits."}
      </p>
    </div>
  );
}
