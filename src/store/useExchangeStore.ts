import { create } from "zustand";
import type { ExchangeId, FeedStatus } from "@/lib/ws/types";
import { EXCHANGE_IDS } from "@/lib/ws/exchanges";

export interface FeedState {
  price?: number;
  changePct?: number;
  status: FeedStatus;
  updatedAt?: number;
}

interface ExchangeStore {
  feeds: Record<ExchangeId, FeedState>;
  setTick: (
    id: ExchangeId,
    tick: { price: number; changePct?: number },
    at: number,
  ) => void;
  setStatus: (id: ExchangeId, status: FeedStatus) => void;
}

const initialFeeds = Object.fromEntries(
  EXCHANGE_IDS.map((id) => [id, { status: "connecting" as FeedStatus }]),
) as Record<ExchangeId, FeedState>;

export const useExchangeStore = create<ExchangeStore>((set) => ({
  feeds: initialFeeds,
  setTick: (id, tick, at) =>
    set((s) => ({
      feeds: {
        ...s.feeds,
        [id]: {
          ...s.feeds[id],
          price: tick.price,
          // keep last known change if this tick doesn't carry one
          changePct: tick.changePct ?? s.feeds[id].changePct,
          status: "online",
          updatedAt: at,
        },
      },
    })),
  setStatus: (id, status) =>
    set((s) => ({
      feeds: { ...s.feeds, [id]: { ...s.feeds[id], status } },
    })),
}));
