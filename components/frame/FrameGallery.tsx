"use client";
import { useState, useEffect } from "react";
import styles from "./FrameGallery.module.css";

interface GalleryItem {
  tokenId: number;
  analogy: string;
  minter: string;
  upvotes: number;
}

export function FrameGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const res = await fetch("/api/gallery?sort=top&page=0");
        const data = await res.json();
        setItems((data.items ?? []).slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch gallery:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGallery();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.section}>
        <h2 className={styles.heading}>Top Thoughts</h2>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className={styles.section}>
      <h2 className={styles.heading}>Top Thoughts</h2>
      <div className={styles.list}>
        {items.map((item) => (
          <div key={item.tokenId} className={styles.card}>
            <p className={styles.analogy}>{item.analogy}</p>
            <div className={styles.meta}>
              <span className={styles.minter}>
                {item.minter.slice(0, 6)}...{item.minter.slice(-4)}
              </span>
              <span className={styles.upvotes}>
                {item.upvotes} {item.upvotes === 1 ? "vote" : "votes"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
