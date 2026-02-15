"use client";
import type { SortMode } from "@/hooks/useGallery";
import { trackEvent } from "@/lib/analytics";
import styles from "./GallerySortToggle.module.css";

interface GallerySortToggleProps {
  sort: SortMode;
  onSortChange: (sort: SortMode) => void;
}

export function GallerySortToggle({ sort, onSortChange }: GallerySortToggleProps) {
  return (
    <div className={styles.container}>
      <button
        className={`${styles.tab} ${sort === "top" ? styles.active : ""}`}
        onClick={() => { trackEvent("Gallery Sort", { sort: "top" }); onSortChange("top"); }}
      >
        Top
      </button>
      <button
        className={`${styles.tab} ${sort === "newest" ? styles.active : ""}`}
        onClick={() => { trackEvent("Gallery Sort", { sort: "newest" }); onSortChange("newest"); }}
      >
        Newest
      </button>
    </div>
  );
}
