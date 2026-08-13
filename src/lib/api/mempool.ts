/** mempool.space — precise fees (sat/vByte) and chain tip. CORS-open. */

export interface RecommendedFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

const FEE_KEYS = [
  "fastestFee",
  "halfHourFee",
  "hourFee",
  "economyFee",
  "minimumFee",
] as const;

export function isRecommendedFees(value: unknown): value is RecommendedFees {
  if (typeof value !== "object" || value === null) return false;

  const fees = value as Record<string, unknown>;
  return FEE_KEYS.every(
    (key) =>
      typeof fees[key] === "number" &&
      Number.isFinite(fees[key]) &&
      fees[key] >= 0,
  );
}

export async function fetchRecommendedFees(
  signal?: AbortSignal,
): Promise<RecommendedFees> {
  const res = await fetch("https://mempool.space/api/v1/fees/precise", {
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error(`mempool fees ${res.status}`);

  const fees: unknown = await res.json();
  if (!isRecommendedFees(fees)) {
    throw new Error("mempool fees returned an invalid payload");
  }
  return fees;
}

export async function fetchTipHeight(signal?: AbortSignal): Promise<number> {
  const res = await fetch("https://mempool.space/api/blocks/tip/height", {
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error(`mempool tip ${res.status}`);
  return Number(await res.text());
}
