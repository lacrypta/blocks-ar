/**
 * CriptoYa — primary data source.
 * Dollar rates: https://criptoya.com/api/dolar
 * BTC/ARS brokers: https://criptoya.com/api/btc/ars/{volume}
 * Both are free, authless and CORS-open (safe to call from the browser).
 */

export interface DollarRate {
  value: number;
  variation?: number;
}

export interface DollarRates {
  oficial?: DollarRate;
  blue?: DollarRate;
  ccl?: DollarRate;
  mep?: DollarRate;
  cripto?: DollarRate;
  /** Average of blue + CCL + MEP + cripto. */
  promedio?: DollarRate;
  time: number;
}

type Raw = Record<string, unknown>;

const mid = (ask?: number, bid?: number) => {
  if (typeof ask === "number" && typeof bid === "number") return (ask + bid) / 2;
  return ask ?? bid;
};

const pick = (o: unknown, path: string[]): number | undefined => {
  let cur: unknown = o;
  for (const k of path) {
    if (cur && typeof cur === "object" && k in (cur as Raw)) {
      cur = (cur as Raw)[k];
    } else return undefined;
  }
  return typeof cur === "number" ? cur : undefined;
};

export async function fetchDolar(signal?: AbortSignal): Promise<DollarRates> {
  const res = await fetch("https://criptoya.com/api/dolar", { signal });
  if (!res.ok) throw new Error(`CriptoYa dolar ${res.status}`);
  const j = (await res.json()) as Raw;

  const blueVal = mid(pick(j, ["blue", "ask"]), pick(j, ["blue", "bid"]));
  const cclVal = pick(j, ["ccl", "al30", "24hs", "price"]);
  const mepVal = pick(j, ["mep", "al30", "24hs", "price"]);
  const criptoVal = mid(
    pick(j, ["cripto", "usdt", "ask"]),
    pick(j, ["cripto", "usdt", "bid"]),
  );
  const oficialVal =
    pick(j, ["oficial", "price"]) ??
    mid(pick(j, ["oficial", "ask"]), pick(j, ["oficial", "bid"]));

  const rate = (
    value?: number,
    variation?: number,
  ): DollarRate | undefined =>
    value === undefined ? undefined : { value, variation };

  const forAvg = [blueVal, cclVal, mepVal, criptoVal].filter(
    (v): v is number => typeof v === "number",
  );
  const promedio =
    forAvg.length > 0
      ? forAvg.reduce((a, b) => a + b, 0) / forAvg.length
      : undefined;

  return {
    oficial: rate(oficialVal, pick(j, ["oficial", "variation"])),
    blue: rate(blueVal, pick(j, ["blue", "variation"])),
    ccl: rate(cclVal, pick(j, ["ccl", "al30", "24hs", "variation"])),
    mep: rate(mepVal, pick(j, ["mep", "al30", "24hs", "variation"])),
    cripto: rate(criptoVal, pick(j, ["cripto", "usdt", "variation"])),
    promedio: rate(promedio),
    time: Date.now(),
  };
}

export interface BrokerQuote {
  key: string;
  /** Final buy price incl. fees (what you pay). */
  totalAsk: number;
  /** Final sell price incl. fees (what you receive). */
  totalBid: number;
  ask: number;
  bid: number;
  /** Spread as a fraction: (totalAsk - totalBid) / totalBid. */
  spread: number;
  time: number;
}

interface RawBroker {
  ask?: number;
  bid?: number;
  totalAsk?: number;
  totalBid?: number;
  time?: number;
}

interface BullBitcoinRateResponse {
  result?: {
    element?: {
      price?: number;
      precision?: number;
      createdAt?: string;
    };
  };
}

const BULL_BITCOIN_PRICE_URL = "https://api.bullbitcoin.com/public/price";

function parseBullBitcoinRate(
  response: BullBitcoinRateResponse,
): { price?: number; time?: number } {
  const element = response.result?.element;
  if (typeof element?.price !== "number") return {};

  const precision = typeof element.precision === "number" ? element.precision : 2;
  const createdAt =
    typeof element.createdAt === "string"
      ? Date.parse(element.createdAt)
      : undefined;

  return {
    price: element.price / 10 ** precision,
    time: Number.isFinite(createdAt) ? createdAt : undefined,
  };
}

async function fetchBullBitcoinBroker(
  signal?: AbortSignal,
  init?: RequestInit,
): Promise<BrokerQuote | null> {
  const [sellRes, buyRes] = await Promise.all([
    fetch(BULL_BITCOIN_PRICE_URL, {
      ...init,
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getRate",
        params: { element: { fromCurrency: "BTC", toCurrency: "ARS" } },
      }),
      signal,
    }),
    fetch(BULL_BITCOIN_PRICE_URL, {
      ...init,
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "getRate",
        params: { element: { fromCurrency: "ARS", toCurrency: "BTC" } },
      }),
      signal,
    }),
  ]);

  if (!sellRes.ok || !buyRes.ok) return null;

  const sell = parseBullBitcoinRate(
    (await sellRes.json()) as BullBitcoinRateResponse,
  );
  const buy = parseBullBitcoinRate(
    (await buyRes.json()) as BullBitcoinRateResponse,
  );
  const totalBid = sell.price ?? 0;
  const totalAsk = buy.price ?? 0;

  if (totalAsk <= 0 && totalBid <= 0) return null;

  const spread =
    totalAsk > 0 && totalBid > 0 ? (totalAsk - totalBid) / totalBid : NaN;

  return {
    key: "bullbitcoin",
    totalAsk,
    totalBid,
    ask: totalAsk,
    bid: totalBid,
    spread,
    time: Math.max(sell.time ?? 0, buy.time ?? 0, Date.now()),
  };
}

export async function fetchBrokers(
  volume = 0.1,
  signal?: AbortSignal,
  init?: RequestInit,
): Promise<BrokerQuote[]> {
  const [res, bullBitcoin] = await Promise.all([
    fetch(`https://criptoya.com/api/btc/ars/${volume}`, {
      ...init,
      signal,
    }),
    fetchBullBitcoinBroker(signal, init).catch(() => null),
  ]);
  if (!res.ok) throw new Error(`CriptoYa brokers ${res.status}`);
  const j = (await res.json()) as Record<string, RawBroker>;

  const quotes: BrokerQuote[] = [];
  for (const [key, v] of Object.entries(j)) {
    const totalAsk = v.totalAsk ?? v.ask ?? 0;
    const totalBid = v.totalBid ?? v.bid ?? 0;
    // Keep a broker if it quotes at least ONE usable side. Many P2P brokers
    // quote only buy or only sell; each column filters its own side, so
    // dropping the whole row would make one-sided brokers vanish from the
    // ranking they legitimately belong in.
    if (totalAsk <= 0 && totalBid <= 0) continue;
    const spread =
      totalAsk > 0 && totalBid > 0 ? (totalAsk - totalBid) / totalBid : NaN;
    quotes.push({
      key,
      totalAsk,
      totalBid,
      ask: v.ask ?? totalAsk,
      bid: v.bid ?? totalBid,
      spread,
      time: v.time ?? Date.now(),
    });
  }

  if (bullBitcoin) {
    quotes.push(bullBitcoin);
  }

  return quotes;
}
