import { NextResponse } from "next/server";

/**
 * Prewarmed snapshot of slow / rate-limited data (CoinGecko).
 * Cached for 30 min so the user path never hits CoinGecko directly
 * (its free tier 429s easily). Refreshed in the background by the cron
 * that pings this route (see vercel.json) and by ISR revalidation.
 */
export const revalidate = 1800; // 30 minutes

interface Snapshot {
  volumeBtc?: number;
  volumeUsd?: number;
  btcUsd?: number;
  updatedAt: number;
}

export async function GET() {
  const snapshot: Snapshot = { updatedAt: Date.now() };

  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global", {
      next: { revalidate: 1800 },
    });
    if (res.ok) {
      const j = (await res.json()) as {
        data?: {
          total_volume?: { btc?: number; usd?: number };
        };
      };
      snapshot.volumeBtc = j.data?.total_volume?.btc;
      snapshot.volumeUsd = j.data?.total_volume?.usd;
    }
  } catch {
    // Serve whatever we have; the client tolerates missing fields.
  }

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
