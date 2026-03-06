"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTickerData } from "@/hooks/useTickerData";
import styles from "./Ticker.module.css";

export function Ticker() {
  const { items, isLoading, flashes } = useTickerData();
  const [manifestoOpen, setManifestoOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<{ text: string; x: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const halfWidthRef = useRef(0);
  const speedRef = useRef(50);
  const firstCopyRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Re-measure when items change (without restarting the animation)
  useEffect(() => {
    const firstCopy = firstCopyRef.current;
    if (!firstCopy || items.length === 0) return;

    // Measure exact pixel width of the first copy using getBoundingClientRect
    const newHalfWidth = firstCopy.getBoundingClientRect().width;
    const oldHalfWidth = halfWidthRef.current;

    // Scale offset proportionally so position stays visually consistent
    if (oldHalfWidth > 0 && newHalfWidth > 0) {
      offsetRef.current = (offsetRef.current / oldHalfWidth) * newHalfWidth;
    }

    halfWidthRef.current = newHalfWidth;
    speedRef.current = newHalfWidth / (items.length * 3);
  }, [items]);

  // Animation loop — runs once on mount, never restarts
  useEffect(() => {
    let lastTime = 0;

    const animate = (time: number) => {
      if (lastTime === 0) lastTime = time;
      const delta = time - lastTime;
      lastTime = time;

      const halfWidth = halfWidthRef.current;

      if (!pausedRef.current && halfWidth > 0) {
        offsetRef.current += (speedRef.current * delta) / 1000;
        if (offsetRef.current >= halfWidth) {
          offsetRef.current -= halfWidth;
        }
        const track = trackRef.current;
        if (track) {
          track.style.transform = `translateX(-${offsetRef.current}px)`;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (!hydrated || isLoading || items.length === 0) {
    return null;
  }

  return (
    <>
      <div className={styles.ticker}>
        <div className={styles.trackWrapper}>
          <div
            ref={trackRef}
            className={styles.track}
            onMouseEnter={() => { pausedRef.current = true; }}
            onMouseLeave={() => { pausedRef.current = false; }}
          >
            {/* Two identical copies for seamless infinite scroll */}
            {[0, 1].map((copy) => (
              <span
                key={copy}
                ref={copy === 0 ? firstCopyRef : undefined}
                className={styles.copy}
              >
                {items.map((item, i) => (
                  <span
                    key={`${copy}-${i}`}
                    className={`${styles.item} ${item.category === "nft" ? styles.nftItem : ""}`}
                    onMouseEnter={(e) => {
                      if (item.tooltip) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setActiveTooltip({ text: item.tooltip, x: rect.left + rect.width / 2 });
                      }
                    }}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <span className={styles.separator}>·</span>
                    {item.category === "nft" && item.href ? (
                      <Link href={item.href} className={styles.nftLink}>
                        <span className={styles.nftLabel}>LATEST MINT</span>
                        <span className={styles.nftValue}>{item.value}</span>
                        <span className={styles.nftUnit}>{" "}{item.unit}</span>
                      </Link>
                    ) : (
                      <>
                        <span className={styles.label}>
                          1 <span className={styles.btcSymbol}>BTC</span> =&nbsp;
                        </span>
                        <span className={`${styles.value} ${
                          flashes.get(item.id) === "up" ? styles.flashUp :
                          flashes.get(item.id) === "down" ? styles.flashDown : ""
                        }`}>{item.value}</span>
                        <span className={styles.unit}>{" "}{item.unit}</span>
                      </>
                    )}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {activeTooltip && (
          <span
            className={styles.tooltip}
            style={{ left: activeTooltip.x }}
          >
            {activeTooltip.text}
          </span>
        )}

        <div className={styles.controls}>
          <button
            className={styles.whyButton}
            onClick={() => setManifestoOpen(true)}
          >
            Why not dollars? →
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
