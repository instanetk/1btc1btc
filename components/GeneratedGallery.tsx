"use client";
import { useState, useEffect, useCallback } from "react";
import { GeneratedCard } from "./GeneratedCard";
import styles from "./GeneratedGallery.module.css";

interface GeneratedAnalogy {
  _id: string;
  text: string;
  domain: string;
  createdAt: string;
}

interface GeneratedGalleryProps {
  onConnect: () => void;
}

export function GeneratedGallery({ onConnect }: GeneratedGalleryProps) {
  const [analogies, setAnalogies] = useState<GeneratedAnalogy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalogies = useCallback(async () => {
    try {
      const res = await fetch("/api/analogies");
      const data = await res.json();
      setAnalogies(data.analogies ?? []);
    } catch {
      setAnalogies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalogies();
  }, [fetchAnalogies]);

  const handleMintSuccess = useCallback(() => {
    fetchAnalogies();
  }, [fetchAnalogies]);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Generated Thoughts</h2>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      ) : analogies.length === 0 ? (
        <div className={styles.empty}>
          <p>No unminted thoughts yet. Generate one above.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {analogies.map((analogy) => (
            <GeneratedCard
              key={analogy._id}
              analogy={analogy}
              onMintSuccess={handleMintSuccess}
              onConnect={onConnect}
            />
          ))}
        </div>
      )}
    </section>
  );
}
