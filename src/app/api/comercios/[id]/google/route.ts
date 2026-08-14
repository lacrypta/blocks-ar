import { getGooglePlace } from "@/lib/merchants/google";
import { getMerchant } from "@/lib/merchants/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  if (!/^\d+$/.test(rawId)) return new Response(null, { status: 404 });
  const merchant = await getMerchant(Number(rawId));
  if (!merchant) return new Response(null, { status: 404 });

  const place = await getGooglePlace(merchant);
  if (!place) return new Response(null, { status: 204 });
  return Response.json(place, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
