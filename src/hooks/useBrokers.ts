"use client";

import { useQuery } from "@tanstack/react-query";
import type { BrokerQuote } from "@/lib/api/criptoya";

export function useBrokers(volume = 0.1) {
  return useQuery({
    queryKey: ["brokers", volume],
    queryFn: async ({ signal }): Promise<BrokerQuote[]> => {
      const res = await fetch(`/api/market/brokers?volume=${volume}`, { signal });
      if (!res.ok) throw new Error(`broker prices ${res.status}`);

      const body = (await res.json()) as { quotes?: BrokerQuote[] };
      return body.quotes ?? [];
    },
    refetchInterval: 30_000,
  });
}
