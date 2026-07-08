import type { ExchangeConfig, ExchangeTick } from "./types";

const num = (v: unknown): number | undefined => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
};

const BULL_BITCOIN_PRICE_URL = "https://api.bullbitcoin.com/public/price";
const BULL_BITCOIN_POLL_MS = 30_000;

interface BullBitcoinPriceResponse {
  result?: {
    element?: {
      price?: number;
      precision?: number;
    };
  };
}

/**
 * Realtime exchange feed configs. Most exchanges stream over WebSocket; Bull
 * Bitcoin currently exposes a public price API, so we poll it instead.
 */
export const EXCHANGES: ExchangeConfig[] = [
  {
    transport: "ws",
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
    transport: "ws",
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
    transport: "ws",
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
    transport: "ws",
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
    transport: "ws",
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
  {
    transport: "poll",
    id: "bullbitcoin",
    name: "Bull Bitcoin",
    quote: "USD",
    pollMs: BULL_BITCOIN_POLL_MS,
    poll: async (signal) => {
      const response = await fetch(BULL_BITCOIN_PRICE_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getRate",
          params: {
            element: { fromCurrency: "BTC", toCurrency: "USD" },
          },
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Bull Bitcoin price request failed: ${response.status}`);
      }

      const data = (await response.json()) as BullBitcoinPriceResponse;
      const minorPrice = num(data.result?.element?.price);
      const precision = num(data.result?.element?.precision) ?? 2;
      if (minorPrice === undefined) {
        throw new Error("Bull Bitcoin price response did not include a price");
      }

      return { price: minorPrice / 10 ** precision };
    },
  },
];

export const EXCHANGE_IDS = EXCHANGES.map((e) => e.id);
