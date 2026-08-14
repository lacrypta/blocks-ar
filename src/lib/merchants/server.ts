import "server-only";

import { cache } from "react";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { normalizeMerchant, type Merchant } from "./model";

const API = "https://api.btcmap.org";
const LIST_FIELDS = [
  "id",
  "lat",
  "lon",
  "icon",
  "name",
  "address",
  "verified_at",
  "osm:payment:bitcoin",
  "osm:payment:onchain",
  "osm:payment:lightning",
  "osm:payment:lightning_contactless",
].join(",");
const DETAIL_FIELDS = [
  LIST_FIELDS,
  "description",
  "opening_hours",
  "phone",
  "website",
  "instagram",
  "email",
  "image",
  "osm_url",
  "required_app_url",
  "payment_provider",
  "osm:contact:instagram",
  "osm:contact:phone",
  "osm:contact:website",
  "osm:contact:email",
].join(",");

type AreaGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

async function fetchJson(url: string, revalidate = 3600): Promise<unknown> {
  const response = await fetch(url, {
    next: { revalidate },
    headers: { "User-Agent": "Blocks.AR/1.0 (+https://www.blocks.ar)" },
  });
  if (!response.ok) throw new Error(`BTC Map respondió ${response.status}`);
  return response.json();
}

const getArgentinaGeometry = cache(async (): Promise<AreaGeometry> => {
  const raw = (await fetchJson(`${API}/v3/areas/ar`, 86400)) as {
    tags?: { geo_json?: AreaGeometry };
  };
  const geometry = raw.tags?.geo_json;
  if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) {
    throw new Error("BTC Map no devolvió el polígono de Argentina");
  }
  return geometry;
});

function isInArgentina(merchant: Merchant, geometry: AreaGeometry) {
  return booleanPointInPolygon(
    [merchant.lon, merchant.lat],
    geometry as Parameters<typeof booleanPointInPolygon>[1],
  );
}

export const getArgentinaMerchants = cache(async (): Promise<Merchant[]> => {
  const [rawPlaces, geometry] = await Promise.all([
    // A 1,900 km circle covers Argentina end-to-end; the official polygon
    // below removes neighboring countries. This regional payload stays below
    // Next's 2 MB persistent-cache limit, unlike the global detailed feed.
    fetchJson(
      `${API}/v4/places/search/?lat=-38.4&lon=-63.6&radius_km=1900`,
    ),
    getArgentinaGeometry(),
  ]);
  if (!Array.isArray(rawPlaces)) throw new Error("Respuesta inválida de BTC Map");

  return rawPlaces
    .map(normalizeMerchant)
    .filter((merchant): merchant is Merchant => Boolean(merchant))
    .filter((merchant) => isInArgentina(merchant, geometry))
    .sort((a, b) => a.name.localeCompare(b.name, "es-AR"));
});

export const getMerchant = cache(async (id: number): Promise<Merchant | null> => {
  if (!Number.isInteger(id) || id <= 0) return null;
  const [raw, geometry] = await Promise.all([
    fetchJson(
      `${API}/v4/places/${id}?fields=${encodeURIComponent(DETAIL_FIELDS)}`,
    ).catch(() => null),
    getArgentinaGeometry(),
  ]);
  const merchant = normalizeMerchant(raw);
  return merchant && isInArgentina(merchant, geometry) ? merchant : null;
});

export const btcMapMerchantUrl = (id: number) =>
  `https://btcmap.org/merchant/${id}`;

export const googleMapsSearchUrl = (merchant: Merchant) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [merchant.name, merchant.address].filter(Boolean).join(", "),
  )}`;
