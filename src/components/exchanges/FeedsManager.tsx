"use client";

import { useExchangeFeeds } from "@/hooks/useExchangeFeeds";

/** Mounts the exchange WebSocket feeds once for the whole app. Renders nothing. */
export function FeedsManager() {
  useExchangeFeeds();
  return null;
}
