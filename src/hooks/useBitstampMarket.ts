"use client";

import { useQuery } from "@tanstack/react-query";

export interface BitstampMarketSnapshot {
  bitstamp?: {
    latestClose?: number;
    latestAt?: number;
    oneHourAgo?: number;
    dayAgo?: number;
    weekAgo?: number;
  };
  fearGreed?: {
    value: number;
    classification?: string;
    classificationEs?: string;
    timestamp?: number;
    nextUpdateInSeconds?: number;
  };
  updatedAt: number;
}

async function fetchBitstampMarket(signal?: AbortSignal) {
  const res = await fetch("/api/market/bitstamp", { signal });
  if (!res.ok) throw new Error(`Bitstamp market ${res.status}`);
  return (await res.json()) as BitstampMarketSnapshot;
}

export function useBitstampMarket() {
  return useQuery({
    queryKey: ["market", "bitstamp"],
    queryFn: ({ signal }) => fetchBitstampMarket(signal),
    refetchInterval: 300_000,
    staleTime: 60_000,
  });
}
