import type { ArExchange } from "./arExchanges";

export type PriceSourceKind = "dedicated" | "aggregator" | "proxy" | "none";

export interface PriceSourceInfo {
  kind: PriceSourceKind;
  /** Provider display name, e.g. "CriptoYa" or "Bull Bitcoin". */
  provider: string;
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
}

const CRIPTOYA_BROKERS_ENDPOINT = "https://criptoya.com/api/btc/ars/{volume}";
const BULL_BITCOIN_ENDPOINT = "https://api.bullbitcoin.com/public/price";

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
  if (criptoyaKey === "bullbitcoin") {
    return {
      kind: "dedicated",
      provider: "Bull Bitcoin",
      endpoint: BULL_BITCOIN_ENDPOINT,
      quoteKey: "bullbitcoin",
      description:
        "Proveedor propio: se consulta la API pública de Bull Bitcoin directamente (getRate BTC/ARS y ARS/BTC).",
    };
  }

  return {
    kind: "aggregator",
    provider: "CriptoYa",
    endpoint: CRIPTOYA_BROKERS_ENDPOINT,
    criptoyaKey,
    quoteKey: criptoyaKey,
    description: `El precio proviene del agregador CriptoYa, con la clave "${criptoyaKey}".`,
  };
}

/**
 * Resolve where an exchange's BTC/ARS quote is sourced from. Only Bull Bitcoin
 * has its own dedicated provider today; everything else comes from the CriptoYa
 * aggregator, and a few exchanges borrow another platform's feed.
 */
export function resolvePriceSource(exchange: ArExchange): PriceSourceInfo {
  if (exchange.key === "bullbitcoin") {
    return {
      kind: "dedicated",
      provider: "Bull Bitcoin",
      endpoint: BULL_BITCOIN_ENDPOINT,
      quoteKey: "bullbitcoin",
      description:
        "Proveedor propio: se consulta la API pública de Bull Bitcoin directamente (getRate BTC/ARS y ARS/BTC).",
    };
  }

  const criptoyaKey = exchange.criptoyaKey;
  if (!criptoyaKey) {
    return {
      kind: "none",
      provider: "Sin fuente de precio",
      description:
        "No hay un feed de precio asociado. Solo se muestran sus datos de soporte y nivel bitcoiner.",
    };
  }

  const proxyOf = PROXY_FEEDS[exchange.key];
  if (proxyOf) {
    return {
      kind: "proxy",
      provider: "CriptoYa",
      endpoint: CRIPTOYA_BROKERS_ENDPOINT,
      criptoyaKey,
      quoteKey: criptoyaKey,
      proxyOf,
      description: `${exchange.name} no publica su propio feed: se muestran precios de ${proxyOf} (clave "${criptoyaKey}") vía CriptoYa.`,
    };
  }

  return {
    kind: "aggregator",
    provider: "CriptoYa",
    endpoint: CRIPTOYA_BROKERS_ENDPOINT,
    criptoyaKey,
    quoteKey: criptoyaKey,
    description: `El precio proviene del agregador CriptoYa, con la clave "${criptoyaKey}".`,
  };
}
