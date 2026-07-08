import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * Background prewarm — invoked by cron every 30 min (see vercel.json), never
 * by a user. Invalidates the cached snapshot so it refreshes from upstream.
 * Protected by CRON_SECRET when set (dev runs allow it open).
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  revalidatePath("/api/snapshot");
  return NextResponse.json({ ok: true, refreshedAt: Date.now() });
}
