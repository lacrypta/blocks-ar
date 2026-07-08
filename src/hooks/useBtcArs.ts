"use client";

import { useBrokers } from "./useBrokers";
import { median } from "@/lib/calc/stats";
import type { BrokerQuote } from "@/lib/api/criptoya";

export interface BtcArs {
  /** Representative BTC price in ARS (median of broker mid prices). */
  value?: number;
  /** Best price to BUY (lowest totalAsk). */
  bestAsk?: number;
  /** Best price to SELL (highest totalBid). */
  bestBid?: number;
  brokers: BrokerQuote[];
  isLoading: boolean;
  isError: boolean;
}

/** Central BTC/ARS reference derived from CriptoYa broker quotes. */
export function useBtcArs(): BtcArs {
  const { data, isLoading, isError } = useBrokers();
  const brokers = data ?? [];

  // Only two-sided quotes contribute a meaningful mid; one-sided P2P brokers
  // carry a 0 on the missing side and must be excluded from these stats.
  const mids = brokers
    .filter((b) => b.totalAsk > 0 && b.totalBid > 0)
    .map((b) => (b.totalAsk + b.totalBid) / 2);
  const asks = brokers.map((b) => b.totalAsk).filter((v) => v > 0);
  const bids = brokers.map((b) => b.totalBid).filter((v) => v > 0);
  const bestAsk = asks.length ? Math.min(...asks) : undefined;
  const bestBid = bids.length ? Math.max(...bids) : undefined;

  return {
    value: median(mids),
    bestAsk,
    bestBid,
    brokers,
    isLoading,
    isError,
  };
}
