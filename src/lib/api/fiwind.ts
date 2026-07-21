/**
 * Fiwind — official price feed (reverse-engineered from panel.fiwind.io).
 *
 * Fiwind publishes live prices over a Socket.IO v4 channel, not a REST
 * endpoint: namespace "/prices" on https://api.fiwind.io, reached through the
 * engine.io path "/pprices/socket.io". The server pushes a full snapshot right
 * after the namespace handshake, so we speak just enough of the polling
 * transport to grab one snapshot and hang up — no socket.io-client dependency
 * and no long-lived socket to babysit in a serverless function.
 *
 * The snapshot is a map of PAIR -> { b: buy, s: sell, v: 24h variation % }.
 * For BTC_ARS, `b` matches CriptoYa's totalAsk (what you pay) and `s` matches
 * totalBid (what you receive), so it maps cleanly onto BrokerQuote.
 *
 * The endpoint is authless and CORS-open, but we call it server-side (via
 * /api/market/fiwind) to keep the socket.io protocol handling off the client.
 */
import type { BrokerQuote } from "./criptoya";

const ENGINE_IO_BASE =
  "https://api.fiwind.io/pprices/socket.io/?EIO=4&transport=polling";
const PRICES_NAMESPACE = "/prices";
/**
 * Kept tight: this runs inside the shared brokers fetch, so a hung socket must
 * never hold up the whole ranking — callers fall back to the aggregate.
 */
const DEFAULT_TIMEOUT_MS = 5000;

/** Cap the handshake, while still honouring a caller's own abort. */
function withTimeout(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

interface RawPair {
  /** Buy price — what you pay (maps to ask/totalAsk). */
  b?: number;
  /** Sell price — what you receive (maps to bid/totalBid). */
  s?: number;
  /** 24h variation, already a percentage. */
  v?: number;
}

export type FiwindPrices = Record<string, RawPair>;

/**
 * Slice out the first balanced {...} object starting at/after `from`. Engine.IO
 * polling responses concatenate packets (separated by the 0x1e record marker),
 * so a plain regex can over-match across frames — brace-count instead.
 */
function jsonObjectAt(text: string, from: number): string | null {
  const start = text.indexOf("{", from);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  return null;
}

/** Pull the price map out of a `42/prices,["prices",{...}]` socket.io frame. */
function parsePricesFrame(text: string): FiwindPrices | null {
  const at = text.indexOf(`42${PRICES_NAMESPACE},["prices",`);
  if (at === -1) return null;
  const obj = jsonObjectAt(text, at);
  if (!obj) return null;
  try {
    return JSON.parse(obj) as FiwindPrices;
  } catch {
    return null;
  }
}

async function pollText(url: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) throw new Error(`Fiwind polling ${res.status}`);
  return res.text();
}

async function post(
  url: string,
  body: string,
  signal: AbortSignal,
): Promise<void> {
  await fetch(url, { method: "POST", body, cache: "no-store", signal });
}

/**
 * Fetch a full live price snapshot from Fiwind's official socket. Runs a single
 * open → connect → poll cycle over the polling transport and disconnects.
 */
export async function fetchFiwindPrices(
  signal?: AbortSignal,
): Promise<FiwindPrices> {
  const sig = withTimeout(signal);

  // 1) Engine.IO open handshake → session id (packet is `0{...}`).
  const openText = await pollText(ENGINE_IO_BASE, sig);
  const openObj = jsonObjectAt(openText, 0);
  const sid = openObj
    ? (JSON.parse(openObj) as { sid?: string }).sid
    : undefined;
  if (!sid) throw new Error("Fiwind handshake: no sid");
  const sessioned = `${ENGINE_IO_BASE}&sid=${encodeURIComponent(sid)}`;

  // 2) Connect to the "/prices" namespace.
  await post(sessioned, `40${PRICES_NAMESPACE},`, sig);

  // 3) The server pushes the snapshot together with the namespace ack.
  let prices = parsePricesFrame(await pollText(sessioned, sig));

  // 4) Fallback: if the ack came alone, subscribe explicitly and poll again.
  if (!prices) {
    await post(sessioned, `42${PRICES_NAMESPACE},["prices"]`, sig);
    prices = parsePricesFrame(await pollText(sessioned, sig));
  }

  // 5) Best-effort disconnect so the session doesn't linger until timeout.
  void post(sessioned, `41${PRICES_NAMESPACE},`, sig).catch(() => {});

  if (!prices) throw new Error("Fiwind: no price snapshot");
  return prices;
}

/** Map a Fiwind pair snapshot onto the shared BrokerQuote shape. */
export function fiwindPairToQuote(
  key: string,
  pair: RawPair | undefined,
): BrokerQuote | null {
  if (!pair || typeof pair.b !== "number" || typeof pair.s !== "number") {
    return null;
  }
  const totalAsk = pair.b;
  const totalBid = pair.s;
  const spread =
    totalAsk > 0 && totalBid > 0 ? (totalAsk - totalBid) / totalBid : NaN;
  return {
    key,
    totalAsk,
    totalBid,
    ask: totalAsk,
    bid: totalBid,
    spread,
    provider: "official",
    variation: typeof pair.v === "number" ? pair.v : undefined,
    time: Date.now(),
  };
}

/** Fetch Fiwind's live BTC/ARS quote straight from their official feed. */
export async function fetchFiwindBtcArs(
  signal?: AbortSignal,
): Promise<BrokerQuote> {
  const prices = await fetchFiwindPrices(signal);
  const quote = fiwindPairToQuote("fiwind", prices["BTC_ARS"]);
  if (!quote) throw new Error("Fiwind: BTC_ARS unavailable");
  return quote;
}
