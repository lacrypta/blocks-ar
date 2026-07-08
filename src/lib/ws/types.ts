export type ExchangeId =
  | "bitfinex"
  | "bitstamp"
  | "kraken"
  | "coinbase"
  | "okx";

export type FeedStatus = "connecting" | "online" | "offline";

export interface ExchangeTick {
  /** Last trade price in USD (or USDT for OKX). */
  price: number;
  /** 24h change as a percentage (e.g. 1.5 = +1.5%). Optional. */
  changePct?: number;
}

export interface ExchangeConfig {
  id: ExchangeId;
  name: string;
  /** Fiat/quote label shown in the UI. */
  quote: string;
  wsUrl: string;
  /** Message(s) to send on open to subscribe. */
  subscribe: (send: (data: unknown) => void) => void;
  /** Parse an incoming message; return a tick or null to ignore. */
  parse: (data: unknown) => ExchangeTick | null;
  /** Optional keep-alive message sent on an interval. */
  ping?: (send: (data: unknown) => void) => void;
}
