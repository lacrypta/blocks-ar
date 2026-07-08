"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRecommendedFees, fetchTipHeight } from "@/lib/api/mempool";
import { annualEmissionPct } from "@/lib/calc/emission";

export function useFees() {
  return useQuery({
    queryKey: ["fees"],
    queryFn: ({ signal }) => fetchRecommendedFees(signal),
    refetchInterval: 45_000,
  });
}

interface SnapshotData {
  volumeBtc?: number;
  volumeUsd?: number;
  btcUsd?: number;
  updatedAt: number;
}

export function useNetwork() {
  const height = useQuery({
    queryKey: ["tip-height"],
    queryFn: ({ signal }) => fetchTipHeight(signal),
    refetchInterval: 120_000,
  });

  const snapshot = useQuery({
    queryKey: ["snapshot"],
    queryFn: async ({ signal }): Promise<SnapshotData> => {
      const res = await fetch("/api/snapshot", { signal });
      if (!res.ok) throw new Error(`snapshot ${res.status}`);
      return res.json();
    },
    refetchInterval: 5 * 60_000,
  });

  const emissionPct =
    height.data !== undefined ? annualEmissionPct(height.data) : undefined;

  return {
    height: height.data,
    emissionPct,
    volumeBtc: snapshot.data?.volumeBtc,
    volumeUsd: snapshot.data?.volumeUsd,
  };
}
