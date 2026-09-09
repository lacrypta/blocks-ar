import { NextResponse } from "next/server";
import { buildPublicQuotes } from "@/lib/quotes/publicQuotes";

export const revalidate = 30;

const headers = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers });
}

/** Public read-only board: same homepage numbers, JSON, no write. */
export async function GET() {
  const body = await buildPublicQuotes();
  return NextResponse.json(body, { headers });
}
