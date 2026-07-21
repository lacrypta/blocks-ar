/**
 * Adapters for each exchange that publishes its own price feed. One function
 * per provider, all normalized onto BrokerQuote.
 *
 * These run server-side (the proxy route, and the OG image path). The browser
 * reaches them through /api/market/official instead, so this module and its
 * per-exchange quirks stay out of the client bundle.
 *
 * Every adapter must resolve to null rather than throw: a broken upstream has
 * to degrade silently to the CriptoYa aggregate, never blank the ranking.
 */
import type { BrokerQuote } from "../criptoya";
import { fetchFiwindBtcArs } from "../fiwind";
import { OFFICIAL_PROVIDER_KEYS } from "./meta";

const TIMEOUT_MS = 5000;

/** Cap each upstream call, while still honouring a caller's own abort. */
function withTimeout(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

/** Several of these APIs return numbers as strings. */
function num(value: unknown): number | undefined {
  const parsed =
    typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { cache: "no-store", signal: withTimeout(signal) });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

/**
 * Build a quote, rejecting anything that fails the two-sided sanity check.
 *
 * This is the guard against the sharpest bug in this file: these APIs disagree
 * about whose point of view "ask"/"bid"/"buy"/"sell" describes, so a mapping
 * mistake silently inverts a row and corrupts the ranking. The buy price a user
 * pays must always exceed the sell price they receive.
 */
function officialQuote(
  key: string,
  ask: number | undefined,
  bid: number | undefined,
  extra?: { time?: number; variation?: number },
): BrokerQuote | null {
  if (ask === undefined || bid === undefined) return null;
  if (!(ask > 0 && bid > 0 && ask > bid)) return null;
  return {
    key,
    totalAsk: ask,
    totalBid: bid,
    ask,
    bid,
    spread: (ask - bid) / bid,
    provider: "official",
    variation: extra?.variation,
    time: extra?.time ?? Date.now(),
  };
}

interface BullBitcoinRate {
  result?: { element?: { price?: number; precision?: number; createdAt?: string } };
}

function parseBullRate(res: BullBitcoinRate) {
  const el = res.result?.element;
  if (typeof el?.price !== "number") return {};
  const precision = typeof el.precision === "number" ? el.precision : 2;
  const createdAt = typeof el.createdAt === "string" ? Date.parse(el.createdAt) : undefined;
  return {
    price: el.price / 10 ** precision,
    time: Number.isFinite(createdAt) ? createdAt : undefined,
  };
}

async function bullBitcoinRate(from: string, to: string, id: number, signal?: AbortSignal) {
  const res = await fetch("https://api.bullbitcoin.com/public/price", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      method: "getRate",
      params: { element: { fromCurrency: from, toCurrency: to } },
    }),
    cache: "no-store",
    signal: withTimeout(signal),
  });
  if (!res.ok) throw new Error(`bullbitcoin ${res.status}`);
  return parseBullRate((await res.json()) as BullBitcoinRate);
}

/**
 * Bull Bitcoin — JSON-RPC. Kept deliberately tolerant of a one-sided response
 * (it has no CriptoYa row to fall back to, so half a quote still beats none).
 */
async function fetchBullBitcoin(signal?: AbortSignal): Promise<BrokerQuote | null> {
  const [sell, buy] = await Promise.all([
    bullBitcoinRate("BTC", "ARS", 1, signal),
    bullBitcoinRate("ARS", "BTC", 2, signal),
  ]);
  const totalBid = sell.price ?? 0;
  const totalAsk = buy.price ?? 0;
  if (totalAsk <= 0 && totalBid <= 0) return null;
  return {
    key: "bullbitcoin",
    totalAsk,
    totalBid,
    ask: totalAsk,
    bid: totalBid,
    spread: totalAsk > 0 && totalBid > 0 ? (totalAsk - totalBid) / totalBid : NaN,
    provider: "official",
    time: Math.max(sell.time ?? 0, buy.time ?? 0, Date.now()),
  };
}

/**
 * Saldo — fields are named from the platform's side, so they read INVERTED:
 * `bid` is what the user pays and `ask` is what the user receives. Verified
 * against CriptoYa (0.000% on both sides with this mapping; swapping them puts
 * the row upside down). Do not "fix" this to look symmetric with the others.
 */
async function fetchSaldo(signal?: AbortSignal): Promise<BrokerQuote | null> {
  const j = (await getJson(
    "https://api.saldo.com.ar/json/rates/banco/bitcoin",
    signal,
  )) as { bitcoin?: { ask?: unknown; bid?: unknown } };
  return officialQuote("saldo", num(j.bitcoin?.bid), num(j.bitcoin?.ask));
}

/** Belo — flat array of pairs; numbers arrive as high-precision strings. */
async function fetchBelo(signal?: AbortSignal): Promise<BrokerQuote | null> {
  const rows = (await getJson("https://api.belo.app/public/price", signal)) as Array<{
    pairCode?: string;
    ask?: unknown;
    bid?: unknown;
  }>;
  if (!Array.isArray(rows)) return null;
  // Match on pairCode: the array carries ~100 pairs in no guaranteed order.
  const row = rows.find((r) => r.pairCode === "BTC/ARS");
  return officialQuote("belo", num(row?.ask), num(row?.bid));
}

/** Tienda Crypto — user-POV naming (`buy` is what you pay) and a real timestamp. */
async function fetchTiendaCrypto(signal?: AbortSignal): Promise<BrokerQuote | null> {
  const j = (await getJson("https://api.tiendacrypto.com/v1/price/all", signal)) as {
    BTC_ARS?: { buy?: unknown; sell?: unknown; timestamp?: unknown };
  };
  const pair = j.BTC_ARS;
  const time = num(pair?.timestamp);
  return officialQuote("tiendacrypto", num(pair?.buy), num(pair?.sell), { time });
}

/**
 * Ripio — the retail wallet backend. Host is app.ripio.com (api.ripio.com 404s)
 * and the trailing slash is required. Naming is user-POV: buy_rate is what you pay.
 */
async function fetchRipio(signal?: AbortSignal): Promise<BrokerQuote | null> {
  const rows = (await getJson("https://app.ripio.com/api/v3/rates/", signal)) as Array<{
    ticker?: string;
    buy_rate?: unknown;
    sell_rate?: unknown;
  }>;
  if (!Array.isArray(rows)) return null;
  const row = rows.find((r) => r.ticker === "BTC_ARS");
  return officialQuote("ripio", num(row?.buy_rate), num(row?.sell_rate));
}

/**
 * Letsbit — a request-for-quote broker, not an order book: the price depends on
 * the size asked for, so we pin 0.1 BTC to match the ranking's volume. Direction
 * lives in `pair_uid`, never in the array order: ARSBTC = user buys (ask),
 * BTCARS = user sells (bid).
 */
async function fetchLetsbit(signal?: AbortSignal): Promise<BrokerQuote | null> {
  const res = await fetch(
    "https://api.letsbit.io/api/v1/lb/broker/prices/public/prices/list",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify([
        { debit_amount: "0.1", pair_uid: "BTCARS" },
        { debit_amount: "10000000", pair_uid: "ARSBTC" },
      ]),
      cache: "no-store",
      signal: withTimeout(signal),
    },
  );
  if (!res.ok) return null;
  const legs = (await res.json()) as Array<{ pair_uid?: string; price?: unknown }>;
  if (!Array.isArray(legs)) return null;
  const ask = num(legs.find((l) => l.pair_uid === "ARSBTC")?.price);
  const bid = num(legs.find((l) => l.pair_uid === "BTCARS")?.price);
  return officialQuote("letsbit", ask, bid);
}

type Fetcher = (signal?: AbortSignal) => Promise<BrokerQuote | null>;

const FETCHERS: Record<string, Fetcher> = {
  bullbitcoin: fetchBullBitcoin,
  fiwind: (signal) => fetchFiwindBtcArs(signal),
  saldo: fetchSaldo,
  belo: fetchBelo,
  tiendacrypto: fetchTiendaCrypto,
  ripio: fetchRipio,
  letsbit: fetchLetsbit,
};

/** Fetch one provider's official quote. Never throws. */
export async function fetchOfficialQuote(
  key: string,
  signal?: AbortSignal,
): Promise<BrokerQuote | null> {
  const fetcher = FETCHERS[key];
  if (!fetcher) return null;
  try {
    return await fetcher(signal);
  } catch {
    return null;
  }
}

/** Fetch every official quote in parallel, dropping the ones that failed. */
export async function fetchAllOfficialQuotes(
  signal?: AbortSignal,
): Promise<BrokerQuote[]> {
  const quotes = await Promise.all(
    OFFICIAL_PROVIDER_KEYS.map((key) => fetchOfficialQuote(key, signal)),
  );
  return quotes.filter((q): q is BrokerQuote => q !== null);
}
