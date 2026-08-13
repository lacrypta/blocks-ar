import { NextResponse } from "next/server";
import { fetchBrokers } from "@/lib/api/criptoya";

/**
 * Proxy the BTC/ARS reference server-side so the satoshi-to-peso calculation
 * does not depend on browser access to third-party price feeds.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestedVolume = Number(
    new URL(request.url).searchParams.get("volume") ?? "0.1",
  );
  const volume =
    Number.isFinite(requestedVolume) && requestedVolume > 0
      ? requestedVolume
      : 0.1;
  const quotes = await fetchBrokers(volume);

  return NextResponse.json(
    { quotes, updatedAt: Date.now() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    },
  );
}
