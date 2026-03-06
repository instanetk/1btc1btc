"use client";
import { useState, useEffect } from "react";
import { useTickerData } from "@/hooks/useTickerData";
import styles from "./Ticker.module.css";

const STORAGE_KEY = "ticker-dismissed";

export function Ticker() {
  const { items, isLoading } = useTickerData();
  const [dismissed, setDismissed] = useState(false);
  const [manifestoOpen, setManifestoOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (typeof window !== "undefined") {
      setDismissed(sessionStorage.getItem(STORAGE_KEY) === "1");
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem(STORAGE_KEY, "1");
  }

  // Don't render during SSR or while loading or if dismissed
  if (!hydrated || isLoading || dismissed || items.length === 0) {
    return null;
  }

  // Dynamic duration: ~3s per item for comfortable reading speed
  const duration = items.length * 3;

  return (
    <>
      <div className={styles.ticker}>
        <div
          className={styles.track}
          style={{ "--ticker-duration": `${duration}s` } as React.CSSProperties}
        >
          {/* Duplicate items for seamless infinite scroll */}
          {[...items, ...items].map((item, i) => (
            <span key={i} className={styles.item}>
              <span className={styles.separator}>·</span>
              <span className={styles.label}>
                1 <span className={styles.btcSymbol}>₿</span> ={" "}
              </span>
              <span className={styles.value}>{item.value}</span>
              <span className={styles.unit}>{" "}{item.unit}</span>
              {item.tooltip && (
                <span className={styles.tooltip}>{item.tooltip}</span>
              )}
            </span>
          ))}
        </div>

        <div className={styles.controls}>
          <button
            className={styles.whyButton}
            onClick={() => setManifestoOpen(true)}
          >
            Why not dollars? →
          </button>
          <button
            className={styles.dismissButton}
            onClick={handleDismiss}
            aria-label="Close ticker"
          >
            ×
          </button>
        </div>
      </div>

      {manifestoOpen && (
        <div
          className={styles.backdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setManifestoOpen(false);
          }}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Why not dollars?</span>
              <button
                className={styles.modalClose}
                onClick={() => setManifestoOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.manifesto}>
              <p>We don&apos;t show the dollar price of Bitcoin here.</p>
              <p>
                Not because we don&apos;t know it. But because it&apos;s the
                wrong question.
              </p>
              <p>
                When you ask &ldquo;how many dollars is one bitcoin
                worth?&rdquo; you&apos;re measuring a fixed thing with a ruler
                that&apos;s shrinking. The dollar lost 97% of its purchasing
                power in the last century. Bitcoin&apos;s supply is capped at 21
                million. <em>Which one is the unit of account?</em>
              </p>
              <p>
                This ticker converts Bitcoin into cows, salt, heartbeats, and
                tulip bulbs — to show you that converting into dollars is equally
                arbitrary. Every unit of measurement is a social agreement. Some
                agreements are more durable than others.
              </p>
              <p>
                <strong>1 BTC = 1 BTC.</strong> That&apos;s the only conversion
                that doesn&apos;t depend on someone else&apos;s monetary policy.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
