import { NextResponse } from "next/server";

export const revalidate = 300;

const BITSTAMP_OHLC_URL =
  "https://www.bitstamp.net/api/v2/ohlc/btcusd/?step=3600&limit=169";
// CoinMarketCap's public chart endpoint (el mismo que usa coinmarketcap.com/charts).
// Requiere un rango; pedimos los últimos días y nos quedamos con `historicalValues.now`.
const CMC_FEAR_GREED_URL =
  "https://api.coinmarketcap.com/data-api/v3/fear-greed/chart";

interface RawBitstampCandle {
  timestamp?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
}

interface RawBitstampOhlc {
  data?: {
    pair?: string;
    ohlc?: RawBitstampCandle[];
  };
}

interface RawCmcFearGreedPoint {
  score?: number;
  name?: string;
  timestamp?: string;
}

interface RawCmcFearGreed {
  data?: {
    historicalValues?: {
      now?: RawCmcFearGreedPoint;
      yesterday?: RawCmcFearGreedPoint;
      lastWeek?: RawCmcFearGreedPoint;
      lastMonth?: RawCmcFearGreedPoint;
    };
    dataList?: RawCmcFearGreedPoint[];
  };
  status?: {
    error_code?: string;
    error_message?: string;
  };
}

interface Candle {
  timestamp: number;
  close: number;
}

const num = (value: unknown): number | undefined => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed)
    ? parsed
    : undefined;
};

// CoinMarketCap devuelve "Extreme fear" / "Fear" / "Neutral" / "Greed" / "Extreme greed".
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

function candleAt(candles: Candle[], fromEnd: number) {
  return candles[candles.length - fromEnd];
}

async function fetchBitstampBases() {
  const res = await fetch(BITSTAMP_OHLC_URL, { next: { revalidate } });
  if (!res.ok) throw new Error(`Bitstamp OHLC ${res.status}`);
  const data = (await res.json()) as RawBitstampOhlc;
  const candles = (data.data?.ohlc ?? [])
    .map((raw): Candle | null => {
      const timestamp = num(raw.timestamp);
      const close = num(raw.close);
      if (timestamp === undefined || close === undefined) return null;
      return { timestamp: timestamp * 1000, close };
    })
    .filter((item): item is Candle => item !== null)
    .sort((a, b) => a.timestamp - b.timestamp);

  const latest = candleAt(candles, 1);

  return {
    latestClose: latest?.close,
    latestAt: latest?.timestamp,
    oneHourAgo: candleAt(candles, 2)?.close,
    dayAgo: candleAt(candles, 25)?.close,
    weekAgo: candleAt(candles, 169)?.close,
  };
}

async function fetchFearGreed() {
  const end = Math.floor(Date.now() / 1000);
  const start = end - 60 * 60 * 24 * 7;
  const url = `${CMC_FEAR_GREED_URL}?start=${start}&end=${end}`;

  const res = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`CoinMarketCap Fear & Greed ${res.status}`);

  const data = (await res.json()) as RawCmcFearGreed;
  const historical = data.data?.historicalValues;
  const list = data.data?.dataList ?? [];
  const item = historical?.now ?? list[list.length - 1];

  const value = num(item?.score);
  const timestamp = num(item?.timestamp);
  if (value === undefined) return undefined;

  return {
    value,
    classification: item?.name,
    classificationEs: translateFearGreed(item?.name),
    timestamp: timestamp !== undefined ? timestamp * 1000 : undefined,
    yesterday: num(historical?.yesterday?.score),
    lastWeek: num(historical?.lastWeek?.score),
    lastMonth: num(historical?.lastMonth?.score),
    source: "CoinMarketCap" as const,
  };
}

export async function GET() {
  const [bitstampResult, fearGreedResult] = await Promise.allSettled([
    fetchBitstampBases(),
    fetchFearGreed(),
  ]);

  return NextResponse.json(
    {
      bitstamp:
        bitstampResult.status === "fulfilled" ? bitstampResult.value : undefined,
      fearGreed:
        fearGreedResult.status === "fulfilled" ? fearGreedResult.value : undefined,
      updatedAt: Date.now(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
