"use client";

import { useExchangeStore } from "@/store/useExchangeStore";
import { average, median } from "@/lib/calc/stats";
import type { ExchangeId } from "@/lib/ws/types";

export interface ExchangeStats {
  /** Median USD price across online exchanges. */
  median?: number;
  /** Average USD price across online exchanges. */
  average?: number;
  /** Reference price (Bitstamp) used for the ARS/BTC dollar. */
  reference?: number;
  onlineCount: number;
  /** True if at least one exchange feed is online. */
  anyOnline: boolean;
}

const REFERENCE: ExchangeId = "bitstamp";

/** Derived, memo-free selector over the exchange feed store. */
export function useExchangeStats(): ExchangeStats {
  const feeds = useExchangeStore((s) => s.feeds);

  const prices: number[] = [];
  let onlineCount = 0;
  for (const state of Object.values(feeds)) {
    if (state.status === "online" && typeof state.price === "number") {
      prices.push(state.price);
      onlineCount += 1;
    }
  }

  return {
    median: median(prices),
    average: average(prices),
    reference: feeds[REFERENCE]?.price,
    onlineCount,
    anyOnline: onlineCount > 0,
  };
}
