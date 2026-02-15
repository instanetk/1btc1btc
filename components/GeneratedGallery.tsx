"use client";
import { useState, useEffect, useCallback } from "react";
import { trackEvent } from "@/lib/analytics";
import { GeneratedCard } from "./GeneratedCard";
import styles from "./GeneratedGallery.module.css";

const PAGE_SIZE = 9;

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
  const [page, setPage] = useState(0);

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

  const totalPages = Math.max(1, Math.ceil(analogies.length / PAGE_SIZE));
  const pagedAnalogies = analogies.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Clamp page if items shrink after a mint
  useEffect(() => {
    if (page >= totalPages) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

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
        <>
          <div className={styles.grid}>
            {pagedAnalogies.map((analogy) => (
              <GeneratedCard
                key={analogy._id}
                analogy={analogy}
                onMintSuccess={handleMintSuccess}
                onConnect={onConnect}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                onClick={() => { trackEvent("Unminted Paginate", { page: page - 1 }); setPage(page - 1); }}
                disabled={page === 0}
              >
                &larr; Prev
              </button>
              <span className={styles.pageInfo}>
                {page + 1} / {totalPages}
              </span>
              <button
                className={styles.pageButton}
                onClick={() => { trackEvent("Unminted Paginate", { page: page + 1 }); setPage(page + 1); }}
                disabled={page >= totalPages - 1}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
