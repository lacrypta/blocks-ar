import type { ArExchange } from "./arExchanges";
import {
  OFFICIAL_PROVIDER_META,
  officialProviderMeta,
} from "@/lib/api/official/meta";

export type PriceSourceKind = "dedicated" | "aggregator" | "proxy" | "none";

/** Stable id suffix for official-feed sources, shared with the dialog. */
export const OFFICIAL_SOURCE_ID_SUFFIX = "-official";

export interface PriceSourceInfo {
  /** Stable identifier, unique among an exchange's available sources. */
  id: string;
  kind: PriceSourceKind;
  /** Provider display name, e.g. "CriptoYa" or "Bull Bitcoin". */
  provider: string;
  /** Compact label for the source switcher (falls back to `provider`). */
  shortLabel?: string;
  /** Endpoint the price is actually fetched from. */
  endpoint?: string;
  /** CriptoYa key used to read this exchange's quote, if applicable. */
  criptoyaKey?: string;
  /** Key under which the live quote is stored in the brokers feed. */
  quoteKey?: string;
  /** Human explanation of where the data comes from. */
  description: string;
  /** Set when the feed belongs to a *different* brand (e.g. Nexo → Buenbit). */
  proxyOf?: string;
  /**
   * When set, the quote is fetched live and directly from the provider (not via
   * the shared brokers feed) — the dialog wires up a dedicated hook for it.
   */
  realtime?: boolean;
}

const CRIPTOYA_BROKERS_ENDPOINT = "https://criptoya.com/api/btc/ars/{volume}";

/**
 * The official source for a key, derived from the provider registry so there is
 * a single place to add an exchange. When one exists it becomes the *primary*
 * source — the app always prefers the official provider — and the aggregate
 * trails as a comparison. Pure: this runs during render.
 */
function officialSources(key?: string): PriceSourceInfo[] {
  const meta = key ? officialProviderMeta(key) : undefined;
  if (!meta) return [];
  return [
    {
      id: `${meta.key}${OFFICIAL_SOURCE_ID_SUFFIX}`,
      kind: "dedicated",
      provider: meta.provider,
      shortLabel: meta.shortLabel,
      endpoint: meta.endpoint,
      quoteKey: meta.key,
      realtime: true,
      description: meta.description,
    },
  ];
}

/** True when this key's price comes from the exchange's own API. */
export function hasOfficialProvider(key?: string): boolean {
  return key !== undefined && key in OFFICIAL_PROVIDER_META;
}

/**
 * Exchanges whose CriptoYa key belongs to a *different* platform, so the price
 * is borrowed rather than their own. Keeps the detail dialog honest about where
 * the number really comes from.
 */
const PROXY_FEEDS: Record<string, string> = {
  nexo: "Buenbit",
};

/** True when this curated exchange borrows another platform's feed. */
export function isProxyFeed(exchangeKey: string): boolean {
  return exchangeKey in PROXY_FEEDS;
}

/**
 * Resolve the price source for a broker-ranking row, keyed directly by its
 * CriptoYa key (the ranking has no proxy aliasing — each row *is* a feed key).
 */
export function resolveBrokerPriceSource(criptoyaKey: string): PriceSourceInfo {
  return {
    id: "criptoya",
    kind: "aggregator",
    provider: "CriptoYa",
    shortLabel: "CriptoYa",
    endpoint: CRIPTOYA_BROKERS_ENDPOINT,
    criptoyaKey,
    quoteKey: criptoyaKey,
    description: `El precio proviene del agregador CriptoYa, con la clave "${criptoyaKey}".`,
  };
}

/**
 * All price sources for a broker-ranking row, primary (the one actually in use)
 * first. When the exchange runs its own official feed that leads, and CriptoYa
 * trails as a comparison.
 */
export function listBrokerPriceSources(criptoyaKey: string): PriceSourceInfo[] {
  const official = officialSources(criptoyaKey);
  // Bull Bitcoin has no CriptoYa row, so there is nothing to compare against.
  if (official.length && officialProviderMeta(criptoyaKey)?.aggregateAvailable === false) {
    return official;
  }
  return [...official, resolveBrokerPriceSource(criptoyaKey)];
}

/**
 * Resolve the *aggregate* source for a curated exchange. Official feeds are
 * layered on top by listExchangePriceSources; here we only describe CriptoYa,
 * the missing-feed case, and the few exchanges that borrow another brand's feed.
 */
export function resolvePriceSource(exchange: ArExchange): PriceSourceInfo {
  const criptoyaKey = exchange.criptoyaKey;
  if (!criptoyaKey) {
    return {
      id: "none",
      kind: "none",
      provider: "Sin fuente de precio",
      description:
        "No hay un feed de precio asociado. Solo se muestran sus datos de soporte y nivel bitcoiner.",
    };
  }

  const proxyOf = PROXY_FEEDS[exchange.key];
  if (proxyOf) {
    return {
      id: "criptoya",
      kind: "proxy",
      provider: "CriptoYa",
      shortLabel: "CriptoYa",
      endpoint: CRIPTOYA_BROKERS_ENDPOINT,
      criptoyaKey,
      quoteKey: criptoyaKey,
      proxyOf,
      description: `${exchange.name} no publica su propio feed: se muestran precios de ${proxyOf} (clave "${criptoyaKey}") vía CriptoYa.`,
    };
  }

  return {
    id: "criptoya",
    kind: "aggregator",
    provider: "CriptoYa",
    shortLabel: "CriptoYa",
    endpoint: CRIPTOYA_BROKERS_ENDPOINT,
    criptoyaKey,
    quoteKey: criptoyaKey,
    description: `El precio proviene del agregador CriptoYa, con la clave "${criptoyaKey}".`,
  };
}

/**
 * All price sources available for a curated exchange, primary first. Mirrors
 * {@link resolvePriceSource} and appends any official feed the exchange exposes
 * (e.g. Fiwind) so the detail dialog can offer a live source switch.
 */
export function listExchangePriceSources(
  exchange: ArExchange,
): PriceSourceInfo[] {
  // Curated entries without a CriptoYa key (Bull Bitcoin) are keyed by own key.
  const key = exchange.criptoyaKey ?? exchange.key;
  const official = officialSources(key);
  if (official.length && officialProviderMeta(key)?.aggregateAvailable === false) {
    return official;
  }
  return [...official, resolvePriceSource(exchange)];
}
