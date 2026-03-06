import { useState, useEffect, useCallback } from "react";
import type { TickerItem } from "@/lib/ticker/conversions";

const POLL_INTERVAL_MS = 60_000;

export function useTickerData() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTicker = useCallback(async () => {
    try {
      const res = await fetch("/api/ticker");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.items)) {
        setItems(data.items);
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

  return { items, isLoading };
}
