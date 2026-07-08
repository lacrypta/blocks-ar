"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBrokers } from "@/lib/api/criptoya";

export function useBrokers(volume = 0.1) {
  return useQuery({
    queryKey: ["brokers", volume],
    queryFn: ({ signal }) => fetchBrokers(volume, signal),
    refetchInterval: 30_000,
  });
}
