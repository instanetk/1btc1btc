"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./AnalogyDisplay.module.css";

const PROVOCATIONS = [
  "What is the sound of one bitcoin clapping?",
  "If a satoshi falls in a forest of ledgers, does it make a price?",
  "What was your wallet address before you were born?",
  "Show me your bitcoin without using numbers.",
  "A student asked the master: how many dollars is one bitcoin? The master said nothing.",
  "What did money look like before the first eye opened?",
  "If you meet fiat on the road, kill it.",
  "Does a block know it has been mined?",
  "What is the weight of a number that cannot be changed?",
  "Before Satoshi wrote the whitepaper, where did bitcoin live?",
  "Two traders argue about the price. Who is holding the bitcoin?",
  "When the last coin is mined, what will be left to count?",
];

interface AnalogyDisplayProps {
  analogy: string | null;
  isLoading: boolean;
  onTextVisible?: (visible: boolean) => void;
  compact?: boolean;
}

export function AnalogyDisplay({ analogy, isLoading, onTextVisible, compact }: AnalogyDisplayProps) {
  const [currentProvocationIndex, setCurrentProvocationIndex] = useState(
    () => Math.floor(Math.random() * PROVOCATIONS.length)
  );
  const [provocationVisible, setProvocationVisible] = useState(true);
  const [textVisible, setTextVisible] = useState(false);
  const hasEverGeneratedRef = useRef(false);

  // Track whether we've ever had an analogy
  useEffect(() => {
    if (analogy !== null) {
      hasEverGeneratedRef.current = true;
    }
  }, [analogy]);

  // Provocation cycling — only in empty state
  useEffect(() => {
    if (analogy !== null || isLoading) return;

    const interval = setInterval(() => {
      setProvocationVisible(false); // Fade out (1s CSS transition)
      setTimeout(() => {
        setCurrentProvocationIndex((prev) =>
          (prev + 1) % PROVOCATIONS.length
        );
        setProvocationVisible(true); // Fade in (1s CSS transition)
      }, 1500); // 1s fade out + 0.5s pause
    }, 5000);

    return () => clearInterval(interval);
  }, [analogy, isLoading]);

  // Text appearance — delay after card solidifies
  useEffect(() => {
    if (analogy !== null && !isLoading) {
      const timer = setTimeout(() => {
        setTextVisible(true);
        onTextVisible?.(true);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setTextVisible(false);
      onTextVisible?.(false);
    }
  }, [analogy, isLoading, onTextVisible]);

  // Determine container state: halo or card
  const isCard = analogy !== null || (isLoading && hasEverGeneratedRef.current);
  const containerClass = `${styles.container} ${isCard ? styles.card : styles.halo}${compact ? ` ${styles.compact}` : ""}`;

  return (
    <div className={containerClass}>
      {/* Provocations — empty state */}
      {analogy === null && !isLoading && (
        <p
          className={styles.provocation}
          style={{ opacity: provocationVisible ? 1 : 0 }}
        >
          {PROVOCATIONS[currentProvocationIndex]}
        </p>
      )}

      {/* Spinner — loading */}
      {isLoading && (
        <div className={styles.spinner} />
      )}

      {/* Analogy text — active state */}
      {analogy !== null && !isLoading && (
        <p
          className={styles.analogy}
          style={{ opacity: textVisible ? 1 : 0 }}
        >
          {analogy}
        </p>
      )}
    </div>
  );
}
