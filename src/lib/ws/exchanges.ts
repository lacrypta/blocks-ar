import type { ExchangeConfig, ExchangeTick } from "./types";

const num = (v: unknown): number | undefined => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
};

/**
 * Per-exchange WebSocket configs. Each `parse` normalizes the raw payload
 * to `{ price, changePct }`. Four exchanges expose 24h change on the ticker
 * channel; Bitstamp's WS only streams trades (price only) — its 24h change
 * is filled in via a REST poll elsewhere.
 */
export const EXCHANGES: ExchangeConfig[] = [
  {
    id: "bitfinex",
    name: "Bitfinex",
    quote: "USD",
    wsUrl: "wss://api-pub.bitfinex.com/ws/2",
    subscribe: (send) =>
      send({ event: "subscribe", channel: "ticker", symbol: "tBTCUSD" }),
    parse: (data): ExchangeTick | null => {
      // [CHAN_ID, [BID,BID_SIZE,ASK,ASK_SIZE,DAILY_CHANGE,DAILY_CHANGE_REL,LAST,VOL,HIGH,LOW]]
      if (!Array.isArray(data) || !Array.isArray(data[1])) return null;
      const arr = data[1] as number[];
      const price = num(arr[6]);
      if (price === undefined) return null;
      const rel = num(arr[5]);
      return { price, changePct: rel !== undefined ? rel * 100 : undefined };
    },
  },
  {
    id: "bitstamp",
    name: "Bitstamp",
    quote: "USD",
    wsUrl: "wss://ws.bitstamp.net",
    subscribe: (send) =>
      send({ event: "bts:subscribe", data: { channel: "live_trades_btcusd" } }),
    parse: (data): ExchangeTick | null => {
      const msg = data as { event?: string; data?: { price?: number } };
      if (msg?.event !== "trade") return null;
      const price = num(msg.data?.price);
      return price === undefined ? null : { price };
    },
  },
  {
    id: "kraken",
    name: "Kraken",
    quote: "USD",
    wsUrl: "wss://ws.kraken.com/v2",
    subscribe: (send) =>
      send({
        method: "subscribe",
        params: { channel: "ticker", symbol: ["BTC/USD"] },
      }),
    parse: (data): ExchangeTick | null => {
      const msg = data as {
        channel?: string;
        data?: Array<{ last?: number; change_pct?: number }>;
      };
      if (msg?.channel !== "ticker" || !Array.isArray(msg.data)) return null;
      const t = msg.data[0];
      const price = num(t?.last);
      if (price === undefined) return null;
      return { price, changePct: num(t?.change_pct) };
    },
  },
  {
    id: "coinbase",
    name: "Coinbase",
    quote: "USD",
    wsUrl: "wss://ws-feed.exchange.coinbase.com",
    subscribe: (send) =>
      send({
        type: "subscribe",
        product_ids: ["BTC-USD"],
        channels: ["ticker"],
      }),
    parse: (data): ExchangeTick | null => {
      const msg = data as {
        type?: string;
        price?: string;
        open_24h?: string;
      };
      if (msg?.type !== "ticker") return null;
      const price = num(msg.price);
      if (price === undefined) return null;
      const open = num(msg.open_24h);
      const changePct =
        open && open > 0 ? ((price - open) / open) * 100 : undefined;
      return { price, changePct };
    },
  },
  {
    id: "okx",
    name: "OKX",
    quote: "USDT",
    wsUrl: "wss://ws.okx.com:8443/ws/v5/public",
    subscribe: (send) =>
      send({
        op: "subscribe",
        args: [{ channel: "tickers", instId: "BTC-USDT" }],
      }),
    parse: (data): ExchangeTick | null => {
      const msg = data as {
        arg?: { channel?: string };
        data?: Array<{ last?: string; open24h?: string }>;
      };
      if (msg?.arg?.channel !== "tickers" || !Array.isArray(msg.data))
        return null;
      const t = msg.data[0];
      const price = num(t?.last);
      if (price === undefined) return null;
      const open = num(t?.open24h);
      const changePct =
        open && open > 0 ? ((price - open) / open) * 100 : undefined;
      return { price, changePct };
    },
    ping: (send) => send("ping"),
  },
];

export const EXCHANGE_IDS = EXCHANGES.map((e) => e.id);
