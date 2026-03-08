"use client";
import { useState, useEffect, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { FrameUpvoteButton } from "./FrameUpvoteButton";
import styles from "./FrameGallery.module.css";

type SortMode = "top" | "newest";

interface GalleryItem {
  tokenId: number;
  analogy: string;
  minter: string;
  upvotes: number;
}

export function FrameGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("top");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchGallery = useCallback(async (sortMode: SortMode) => {
    try {
      const res = await fetch(`/api/gallery?sort=${sortMode}&page=0`);
      const data = await res.json();
      setItems((data.items ?? []).slice(0, 10));
    } catch (err) {
      console.error("Failed to fetch gallery:", err);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchGallery(sort).finally(() => setIsLoading(false));
  }, [sort, fetchGallery]);

  const handleSortChange = (newSort: SortMode) => {
    if (newSort === sort) return;
    setSort(newSort);
    setExpandedId(null);
  };

  const handleCardTap = (tokenId: number) => {
    setExpandedId(expandedId === tokenId ? null : tokenId);
    try {
      sdk.haptics.impactOccurred("light");
    } catch {
      // Haptics not available outside Farcaster client
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      sdk.haptics.impactOccurred("medium");
    } catch {
      // Haptics not available
    }
    await fetchGallery(sort);
    setIsRefreshing(false);
  };

  const handleViewFullGallery = () => {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://1btc1btc.money";
    try {
      sdk.actions.openUrl(`${siteUrl}/#gallery`);
    } catch {
      window.open(`${siteUrl}/#gallery`, "_blank");
    }
  };

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
      <div className={styles.header}>
        <h2 className={styles.heading}>
          {sort === "top" ? "Top" : "Newest"} Thoughts
        </h2>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh gallery"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isRefreshing ? styles.spinning : ""}
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
          <div className={styles.sortToggle}>
            <button
              className={`${styles.sortTab} ${sort === "top" ? styles.active : ""}`}
              onClick={() => handleSortChange("top")}
            >
              Top
            </button>
            <button
              className={`${styles.sortTab} ${sort === "newest" ? styles.active : ""}`}
              onClick={() => handleSortChange("newest")}
            >
              Newest
            </button>
          </div>
        </div>
      </div>
      <div className={styles.list}>
        {items.map((item) => (
          <div
            key={item.tokenId}
            className={`${styles.card} ${expandedId === item.tokenId ? styles.cardExpanded : ""}`}
            onClick={() => handleCardTap(item.tokenId)}
          >
            <p className={styles.analogy}>{item.analogy}</p>
            <div className={styles.meta}>
              <span className={styles.minter}>
                {item.minter.slice(0, 6)}...{item.minter.slice(-4)}
              </span>
              <div onClick={(e) => e.stopPropagation()}>
                <FrameUpvoteButton
                  tokenId={item.tokenId}
                  currentUpvotes={item.upvotes}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className={styles.viewFullGallery} onClick={handleViewFullGallery}>
        View all on 1btc1btc.money &rarr;
      </button>
    </div>
  );
}
