import { fetchBrokers, fetchDolar } from "@/lib/api/criptoya";
import { median } from "@/lib/calc/stats";

const BITSTAMP_OHLC_URL =
  "https://www.bitstamp.net/api/v2/ohlc/btcusd/?step=3600&limit=169";
const BITSTAMP_TICKER_URL = "https://www.bitstamp.net/api/v2/ticker/btcusd/";
const CMC_FEAR_GREED_URL =
  "https://api.coinmarketcap.com/data-api/v3/fear-greed/chart";

export interface QuotedNumber {
  value: number | null;
  source: string;
  variation?: number | null;
}

export interface PublicQuotes {
  updatedAt: string;
  updatedAtMs: number;
  bitstamp: {
    usd: number | null;
    source: "Bitstamp";
    latestAt: number | null;
    change: {
      h1: number | null;
      h24: number | null;
      week: number | null;
    };
    bases: {
      oneHourAgo: number | null;
      dayAgo: number | null;
      weekAgo: number | null;
    };
  };
  btcArs: QuotedNumber;
  satoshiArs: QuotedNumber;
  dollars: {
    promedio: QuotedNumber;
    blue: QuotedNumber;
    ccl: QuotedNumber;
    mep: QuotedNumber;
    cripto: QuotedNumber;
    bitcoinCm: QuotedNumber & { hint?: string | null };
  };
  fearGreed: {
    value: number | null;
    classification: string | null;
    classificationEs: string | null;
    source: string | null;
  };
  errors: Record<string, string>;
}

const pct = (latest?: number, past?: number): number | null => {
  if (latest === undefined || past === undefined || past === 0) return null;
  return ((latest - past) / past) * 100;
};

const num = (value: unknown): number | undefined => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed)
    ? parsed
    : undefined;
};

const quoted = (
  value: number | undefined,
  source: string,
  variation?: number,
): QuotedNumber => ({
  value: value ?? null,
  source,
  variation: variation ?? null,
});

const translateFearGreed = (classification?: string) => {
  switch (classification?.toLowerCase()) {
    case "extreme fear":
      return "Miedo extremo";
    case "fear":
      return "Miedo";
    case "neutral":
      return "Neutral";
    case "greed":
      return "Codicia";
    case "extreme greed":
      return "Codicia extrema";
    default:
      return classification;
  }
};

async function fetchBitstampSpot() {
  const [ohlcRes, tickerRes] = await Promise.all([
    fetch(BITSTAMP_OHLC_URL, { next: { revalidate: 300 } }),
    fetch(BITSTAMP_TICKER_URL, { next: { revalidate: 30 } }),
  ]);
  if (!ohlcRes.ok) throw new Error(`Bitstamp OHLC ${ohlcRes.status}`);

  const ohlc = (await ohlcRes.json()) as {
    data?: { ohlc?: { timestamp?: string; close?: string }[] };
  };
  const candles = (ohlc.data?.ohlc ?? [])
    .map((raw) => {
      const timestamp = num(raw.timestamp);
      const close = num(raw.close);
      if (timestamp === undefined || close === undefined) return null;
      return { timestamp: timestamp * 1000, close };
    })
    .filter((item): item is { timestamp: number; close: number } => item !== null)
    .sort((a, b) => a.timestamp - b.timestamp);

  const at = (fromEnd: number) => candles[candles.length - fromEnd];
  const latestClose = at(1)?.close;
  const oneHourAgo = at(2)?.close;
  const dayAgo = at(25)?.close;
  const weekAgo = at(169)?.close;

  let last: number | undefined;
  if (tickerRes.ok) {
    const ticker = (await tickerRes.json()) as { last?: string };
    last = num(ticker.last);
  }

  const usd = last ?? latestClose;
  return {
    usd,
    latestAt: at(1)?.timestamp,
    oneHourAgo,
    dayAgo,
    weekAgo,
    change: {
      h1: pct(usd, oneHourAgo),
      h24: pct(usd, dayAgo),
      week: pct(usd, weekAgo),
    },
  };
}

async function fetchFearGreed() {
  const end = Math.floor(Date.now() / 1000);
  const start = end - 60 * 60 * 24 * 7;
  const res = await fetch(`${CMC_FEAR_GREED_URL}?start=${start}&end=${end}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Fear & Greed ${res.status}`);
  const data = (await res.json()) as {
    data?: {
      historicalValues?: { now?: { score?: number; name?: string } };
      dataList?: { score?: number; name?: string }[];
    };
  };
  const item =
    data.data?.historicalValues?.now ??
    data.data?.dataList?.[data.data.dataList.length - 1];
  const value = num(item?.score);
  if (value === undefined) return undefined;
  return {
    value,
    classification: item?.name,
    classificationEs: translateFearGreed(item?.name),
    source: "CoinMarketCap",
  };
}

/** Same numbers the homepage shows: Bitstamp, broker median, CriptoYa dollars. */
export async function buildPublicQuotes(): Promise<PublicQuotes> {
  const errors: Record<string, string> = {};
  const updatedAtMs = Date.now();

  const [bitstampResult, fearResult, dolarResult, brokersResult] =
    await Promise.allSettled([
      fetchBitstampSpot(),
      fetchFearGreed(),
      fetchDolar(),
      fetchBrokers(0.1),
    ]);

  if (bitstampResult.status === "rejected") {
    errors.bitstamp =
      bitstampResult.reason instanceof Error
        ? bitstampResult.reason.message
        : "bitstamp failed";
  }
  if (fearResult.status === "rejected") {
    errors.fearGreed =
      fearResult.reason instanceof Error
        ? fearResult.reason.message
        : "fear greed failed";
  }
  if (dolarResult.status === "rejected") {
    errors.dollars =
      dolarResult.reason instanceof Error
        ? dolarResult.reason.message
        : "dollars failed";
  }
  if (brokersResult.status === "rejected") {
    errors.btcArs =
      brokersResult.reason instanceof Error
        ? brokersResult.reason.message
        : "brokers failed";
  }

  const bitstamp =
    bitstampResult.status === "fulfilled" ? bitstampResult.value : undefined;
  const dollars =
    dolarResult.status === "fulfilled" ? dolarResult.value : undefined;
  const brokers =
    brokersResult.status === "fulfilled" ? brokersResult.value : [];
  const fear =
    fearResult.status === "fulfilled" ? fearResult.value : undefined;

  const mids = brokers
    .filter((b) => b.totalAsk > 0 && b.totalBid > 0)
    .map((b) => (b.totalAsk + b.totalBid) / 2);
  const btcArs = median(mids);
  const satoshiArs =
    btcArs !== undefined ? btcArs / 100_000_000 : undefined;
  const bitcoinCm =
    btcArs !== undefined && bitstamp?.usd && bitstamp.usd > 0
      ? btcArs / bitstamp.usd
      : undefined;
  const ccl = dollars?.ccl?.value;
  const brecha =
    bitcoinCm !== undefined && ccl && ccl > 0
      ? (bitcoinCm / ccl - 1) * 100
      : undefined;

  return {
    updatedAt: new Date(updatedAtMs).toISOString(),
    updatedAtMs,
    bitstamp: {
      usd: bitstamp?.usd ?? null,
      source: "Bitstamp",
      latestAt: bitstamp?.latestAt ?? null,
      change: {
        h1: bitstamp?.change.h1 ?? null,
        h24: bitstamp?.change.h24 ?? null,
        week: bitstamp?.change.week ?? null,
      },
      bases: {
        oneHourAgo: bitstamp?.oneHourAgo ?? null,
        dayAgo: bitstamp?.dayAgo ?? null,
        weekAgo: bitstamp?.weekAgo ?? null,
      },
    },
    btcArs: quoted(btcArs, "CriptoYa brokers median mid"),
    satoshiArs: quoted(satoshiArs, "btcArs / 1e8"),
    dollars: {
      promedio: quoted(dollars?.promedio?.value, "CriptoYa"),
      blue: quoted(dollars?.blue?.value, "CriptoYa", dollars?.blue?.variation),
      ccl: quoted(dollars?.ccl?.value, "CriptoYa", dollars?.ccl?.variation),
      mep: quoted(dollars?.mep?.value, "CriptoYa", dollars?.mep?.variation),
      cripto: quoted(
        dollars?.cripto?.value,
        "CriptoYa USDT",
        dollars?.cripto?.variation,
      ),
      bitcoinCm: {
        ...quoted(bitcoinCm, "btcArs / Bitstamp USD"),
        hint:
          brecha !== undefined
            ? `Brecha vs CCL ${brecha.toFixed(2)}%`
            : null,
      },
    },
    fearGreed: {
      value: fear?.value ?? null,
      classification: fear?.classification ?? null,
      classificationEs: fear?.classificationEs ?? null,
      source: fear?.source ?? null,
    },
    errors,
  };
}
