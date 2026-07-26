"use client";

import { useMemo } from "react";
import { useBtcArs } from "./useBtcArs";
import { useExchangeStats } from "./useExchangeStats";
import { useDollars } from "./useDollars";
import { routesFor, type MarketRates, type SwapQuote } from "@/lib/data/swapProviders";

export interface SwapRoutes {
  rates: MarketRates;
  /** All routes for the currency, best payout first. */
  routes: SwapQuote[];
  /** Best quotable route, if any. */
  best?: SwapQuote;
  isLoading: boolean;
}

/**
 * Live reference rates for the converter: BTC/ARS from the broker median and
 * BTC/USD from the exchange feeds (falling back to the crypto dollar).
 */
export function useSwapRoutes(code: string, sats: number): SwapRoutes {
  const { value: btcArs, isLoading: loadingArs } = useBtcArs();
  const { reference, median } = useExchangeStats();
  const { data: dollars } = useDollars();

  const btcUsd = reference ?? median;
  const usdt = dollars?.cripto?.value;
  const btcArsFallback =
    btcArs ?? (btcUsd && usdt ? btcUsd * usdt : undefined);

  const rates: MarketRates = useMemo(
    () => ({ btcArs: btcArsFallback, btcUsd }),
    [btcArsFallback, btcUsd],
  );

  const routes = useMemo(() => routesFor(code, sats, rates), [code, sats, rates]);

  return {
    rates,
    routes,
    best: routes.find((r) => r.ok),
    isLoading: loadingArs && btcUsd === undefined,
  };
}
