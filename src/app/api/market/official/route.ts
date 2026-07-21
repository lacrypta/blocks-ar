import { NextResponse } from "next/server";
import { fetchAllOfficialQuotes } from "@/lib/api/official/fetchers";

/**
 * Live quotes from every exchange that runs its own price feed, in one payload.
 *
 * Proxied server-side for three reasons: several of these endpoints send no CORS
 * headers at all, one of them is a socket handshake rather than a plain GET, and
 * the small Argentine APIs behind Cloudflare rate-limit hard — a single shared,
 * CDN-cached route collapses every visitor into one upstream call. Bundling them
 * into one route also keeps the client to a single request per refresh.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const quotes = await fetchAllOfficialQuotes();

  return NextResponse.json(
    { quotes, updatedAt: Date.now() },
    {
      headers: {
        // Short window: fresh enough to feel live, long enough that a burst of
        // visitors never fans out to the upstreams.
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    },
  );
}
