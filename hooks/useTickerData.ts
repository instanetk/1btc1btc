import { useState, useEffect, useCallback, useRef } from "react";
import type { TickerItem } from "@/lib/ticker/conversions";

const POLL_INTERVAL_MS = 30_000;

export type FlashDirection = "up" | "down";

export function useTickerData() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [flashes, setFlashes] = useState<Map<string, FlashDirection>>(new Map());
  const prevValuesRef = useRef<Map<string, string>>(new Map());

  const fetchTicker = useCallback(async () => {
    try {
      const res = await fetch("/api/ticker");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.items)) {
        const newItems: TickerItem[] = data.items;

        // Compare values by id to detect changes
        const prevValues = prevValuesRef.current;
        const newFlashes = new Map<string, FlashDirection>();

        for (const item of newItems) {
          if (!item.id || item.category === "punchline" || item.category === "nft") continue;
          const prevValue = prevValues.get(item.id);
          if (prevValue !== undefined && prevValue !== item.value) {
            const prev = parseFloat(prevValue.replace(/,/g, "").replace("M", "e6"));
            const curr = parseFloat(item.value.replace(/,/g, "").replace("M", "e6"));
            if (!isNaN(prev) && !isNaN(curr) && prev !== curr) {
              newFlashes.set(item.id, curr > prev ? "up" : "down");
            }
          }
        }

        // Update previous values ref
        const nextPrevValues = new Map<string, string>();
        for (const item of newItems) {
          if (item.id) nextPrevValues.set(item.id, item.value);
        }
        prevValuesRef.current = nextPrevValues;

        setItems(newItems);

        if (newFlashes.size > 0) {
          setFlashes(newFlashes);
          setTimeout(() => setFlashes(new Map()), 2000);
        }
      }
    } catch {
      // Silently fail — ticker is non-critical UI
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTicker();
    const interval = setInterval(fetchTicker, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchTicker]);

  return { items, isLoading, flashes };
}
