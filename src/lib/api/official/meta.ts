/**
 * Registry of exchanges that publish their own price feed, which we always
 * prefer over the CriptoYa aggregate.
 *
 * This module is metadata only — no fetching — so client components (the detail
 * dialog, priceSource) can import it without pulling the adapters into the
 * browser bundle. The matching fetchers live in ./fetchers.
 *
 * ADMISSION RULE — read before adding an entry. The ranking compares *final*
 * prices with fees included, so a feed only belongs here if it quotes on that
 * same basis. Several exchanges publish a raw, pre-fee order book (Bitso,
 * SatoshiTango, CryptoMKT/Notbank, Binance): adopting those would make them
 * look artificially cheap and wrongly win the "Mejor" badge. Verify a candidate
 * against CriptoYa's totalAsk/totalBid first — a systematic gap in the
 * fee direction means the feed is raw, and it stays on the aggregate.
 */

export interface OfficialProviderMeta {
  /** CriptoYa broker key this provider overrides. */
  key: string;
  /** Provider display name shown in the detail dialog. */
  provider: string;
  /** Compact label for the source switcher. */
  shortLabel: string;
  /** Human-readable endpoint shown as provenance. */
  endpoint: string;
  /** Explanation shown in the dialog. */
  description: string;
  /**
   * False when the exchange has no CriptoYa row at all (Bull Bitcoin), so the
   * dialog offers the official feed alone with no aggregate to compare against.
   */
  aggregateAvailable?: boolean;
}

export const OFFICIAL_PROVIDER_META: Record<string, OfficialProviderMeta> = {
  bullbitcoin: {
    key: "bullbitcoin",
    provider: "Bull Bitcoin — API oficial",
    shortLabel: "Bull Bitcoin",
    endpoint: "https://api.bullbitcoin.com/public/price (JSON-RPC getRate)",
    description:
      "Proveedor propio: se consulta la API pública de Bull Bitcoin directamente (getRate BTC/ARS y ARS/BTC). No figura en CriptoYa.",
    aggregateAvailable: false,
  },
  fiwind: {
    key: "fiwind",
    provider: "Fiwind — API oficial",
    shortLabel: "Fiwind API",
    endpoint: "wss://api.fiwind.io/prices (Socket.IO · par BTC_ARS)",
    description:
      "Fuente por defecto: el precio se toma directamente del socket de precios de Fiwind (API oficial), sin pasar por un agregador. Se lee el par BTC_ARS.",
  },
  saldo: {
    key: "saldo",
    provider: "Saldo — API oficial",
    shortLabel: "Saldo API",
    endpoint: "https://api.saldo.com.ar/json/rates/banco/bitcoin",
    description:
      "Fuente por defecto: cotización final tomada de la API pública de Saldo, sin pasar por un agregador.",
  },
  belo: {
    key: "belo",
    provider: "Belo — API oficial",
    shortLabel: "Belo API",
    endpoint: "https://api.belo.app/public/price (par BTC/ARS)",
    description:
      "Fuente por defecto: cotización final tomada de la API pública de Belo, sin pasar por un agregador.",
  },
  tiendacrypto: {
    key: "tiendacrypto",
    provider: "Tienda Crypto — API oficial",
    shortLabel: "Tienda API",
    endpoint: "https://api.tiendacrypto.com/v1/price/all (par BTC_ARS)",
    description:
      "Fuente por defecto: cotización final tomada de la API pública de Tienda Crypto, sin pasar por un agregador.",
  },
  ripio: {
    key: "ripio",
    provider: "Ripio — API oficial",
    shortLabel: "Ripio API",
    endpoint: "https://app.ripio.com/api/v3/rates/ (ticker BTC_ARS)",
    description:
      "Fuente por defecto: cotización final tomada del feed de tasas de Ripio, sin pasar por un agregador.",
  },
  letsbit: {
    key: "letsbit",
    provider: "Letsbit — API oficial",
    shortLabel: "Letsbit API",
    endpoint:
      "https://api.letsbit.io/api/v1/lb/broker/prices/public/prices/list (RFQ 0,1 BTC)",
    description:
      "Fuente por defecto: se pide una cotización en firme a la API pública de Letsbit por 0,1 BTC, el mismo volumen que usa el ranking.",
  },
};

export const OFFICIAL_PROVIDER_KEYS = Object.keys(OFFICIAL_PROVIDER_META);

export function officialProviderMeta(
  key: string,
): OfficialProviderMeta | undefined {
  return OFFICIAL_PROVIDER_META[key];
}
