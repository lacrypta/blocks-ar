"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDolar } from "@/lib/api/criptoya";

export function useDollars() {
  return useQuery({
    queryKey: ["dolar"],
    queryFn: ({ signal }) => fetchDolar(signal),
    refetchInterval: 30_000,
  });
}
