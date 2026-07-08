/** mempool.space — recommended fees (sat/vByte) and chain tip. CORS-open. */

export interface RecommendedFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export async function fetchRecommendedFees(
  signal?: AbortSignal,
): Promise<RecommendedFees> {
  const res = await fetch("https://mempool.space/api/v1/fees/recommended", {
    signal,
  });
  if (!res.ok) throw new Error(`mempool fees ${res.status}`);
  return (await res.json()) as RecommendedFees;
}

export async function fetchTipHeight(signal?: AbortSignal): Promise<number> {
  const res = await fetch("https://mempool.space/api/blocks/tip/height", {
    signal,
  });
  if (!res.ok) throw new Error(`mempool tip ${res.status}`);
  return Number(await res.text());
}
