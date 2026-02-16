"use client";
import { useState, useCallback, useEffect } from "react";
import { useTotalSupply } from "@/hooks/useTotalSupply";
import { PROGRESS_RANGES, MINT_COST_SATS, SATS_PER_BTC, ONE_BTC_MILESTONE } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";
import styles from "./ProgressBar.module.css";

export function ProgressBar() {
  const { totalSupply } = useTotalSupply();
  const [rangeIndex, setRangeIndex] = useState(0);

  // Auto-graduate past surpassed ranges
  useEffect(() => {
    if (totalSupply == null) return;
    let idx = 0;
    while (idx < PROGRESS_RANGES.length - 1 && totalSupply >= PROGRESS_RANGES[idx].mints) {
      idx++;
    }
    setRangeIndex(idx);
  }, [totalSupply]);

  const cycleRange = useCallback(() => {
    setRangeIndex((prev) => {
      // Find the lowest eligible range (not surpassed)
      const minIndex = totalSupply != null
        ? PROGRESS_RANGES.findIndex((r) => totalSupply < r.mints)
        : 0;
      const min = minIndex === -1 ? PROGRESS_RANGES.length - 1 : minIndex;
      const next = prev + 1;
      const newIndex = next >= PROGRESS_RANGES.length ? min : Math.max(next, min);
      trackEvent("Progress Bar Zoom", { range: PROGRESS_RANGES[newIndex].label });
      return newIndex;
    });
  }, [totalSupply]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        cycleRange();
      }
    },
    [cycleRange]
  );

  const range = PROGRESS_RANGES[rangeIndex];
  const supply = totalSupply ?? 0;
  const pct = Math.min((supply / range.mints) * 100, 100);
  const btcEarned = (supply * MINT_COST_SATS) / SATS_PER_BTC;
  const milestoneReached = supply >= ONE_BTC_MILESTONE;

  return (
    <div
      className={`${styles.bar} ${milestoneReached ? styles.milestone : ""}`}
      role="button"
      tabIndex={0}
      onClick={cycleRange}
      onKeyDown={handleKeyDown}
      aria-label={`Mint progress: ${totalSupply != null ? supply : "loading"} of ${range.mints} mints toward ${range.label}. Click to change range.`}
    >
      <div className={styles.inner}>
        {totalSupply != null ? (
          <span className={styles.label}>
            {milestoneReached && <span className={styles.milestoneIcon}>&#x20bf; </span>}
            <span className={styles.accent}>{supply.toLocaleString()}</span>
            <span className={styles.muted}> / {range.mints.toLocaleString()} mints · </span>
            <span className={styles.accent}>{btcEarned.toFixed(4)}</span>
            <span className={styles.muted}> / {range.label}</span>
            {milestoneReached && (
              <span className={styles.milestoneLabel}> · 1 BTC REACHED</span>
            )}
          </span>
        ) : (
          <span className={`${styles.label} ${styles.muted}`}>-- / -- mints</span>
        )}
        <span className={styles.rangeIndicator}>
          {rangeIndex + 1}/{PROGRESS_RANGES.length}
        </span>
      </div>
      <div className={styles.track}>
        <div className={`${styles.fill} ${milestoneReached ? styles.fillMilestone : ""}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
