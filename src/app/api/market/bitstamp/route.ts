import { NextResponse } from "next/server";

export const revalidate = 300;

const BITSTAMP_OHLC_URL =
  "https://www.bitstamp.net/api/v2/ohlc/btcusd/?step=3600&limit=169";
const FEAR_GREED_URL = "https://api.alternative.me/fng/?limit=1&format=json";

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

interface RawFearGreed {
  data?: Array<{
    value?: string;
    value_classification?: string;
    timestamp?: string;
    time_until_update?: string;
  }>;
  metadata?: {
    error?: string | null;
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

const translateFearGreed = (classification?: string) => {
  switch (classification) {
    case "Extreme Fear":
      return "Miedo extremo";
    case "Fear":
      return "Miedo";
    case "Neutral":
      return "Neutral";
    case "Greed":
      return "Codicia";
    case "Extreme Greed":
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
  const res = await fetch(FEAR_GREED_URL, { next: { revalidate } });
  if (!res.ok) throw new Error(`Fear & Greed ${res.status}`);
  const data = (await res.json()) as RawFearGreed;
  const item = data.data?.[0];
  const value = num(item?.value);
  const timestamp = num(item?.timestamp);
  const nextUpdate = num(item?.time_until_update);

  if (value === undefined) return undefined;

  return {
    value,
    classification: item?.value_classification,
    classificationEs: translateFearGreed(item?.value_classification),
    timestamp: timestamp !== undefined ? timestamp * 1000 : undefined,
    nextUpdateInSeconds: nextUpdate,
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
