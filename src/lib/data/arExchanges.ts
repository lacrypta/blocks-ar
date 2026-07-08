/**
 * Curated dataset of Argentine exchanges/wallets and their Bitcoin support.
 *
 * ⚠️ IMPORTANT: Lightning / Lightning Address support changes frequently and
 * there is no API for it. These values are a best-effort seed and MUST be
 * verified against each platform before relying on them. The UI shows a
 * "datos a verificar" disclaimer accordingly.
 */

export type Support = boolean;

export interface ArExchange {
  key: string;
  name: string;
  url: string;
  /** Custodial (exchange holds keys) vs non-custodial. */
  custodial: boolean;
  btcOnchain: Support;
  lightning: Support;
  /** Supports receiving to a Lightning Address (user@domain). */
  lightningAddress: Support;
  /** Matching CriptoYa broker key, if it publishes BTC/ARS prices. */
  criptoyaKey?: string;
  notes?: string;
}

export const AR_EXCHANGES: ArExchange[] = [
  {
    key: "lemon",
    name: "Lemon",
    url: "https://www.lemon.me",
    custodial: true,
    btcOnchain: true,
    lightning: true,
    lightningAddress: false,
    criptoyaKey: "lemoncash",
  },
  {
    key: "belo",
    name: "Belo",
    url: "https://www.belo.app",
    custodial: true,
    btcOnchain: true,
    lightning: true,
    lightningAddress: false,
    criptoyaKey: "belo",
  },
  {
    key: "ripio",
    name: "Ripio",
    url: "https://www.ripio.com",
    custodial: true,
    btcOnchain: true,
    lightning: true,
    lightningAddress: true,
    criptoyaKey: "ripio",
  },
  {
    key: "buenbit",
    name: "Buenbit",
    url: "https://www.buenbit.com",
    custodial: true,
    btcOnchain: true,
    lightning: false,
    lightningAddress: false,
    criptoyaKey: "buenbit",
  },
  {
    key: "satoshitango",
    name: "SatoshiTango",
    url: "https://www.satoshitango.com",
    custodial: true,
    btcOnchain: true,
    lightning: true,
    lightningAddress: false,
    criptoyaKey: "satoshitango",
  },
  {
    key: "fiwind",
    name: "Fiwind",
    url: "https://fiwind.io",
    custodial: true,
    btcOnchain: true,
    lightning: false,
    lightningAddress: false,
    criptoyaKey: "fiwind",
  },
  {
    key: "letsbit",
    name: "Letsbit",
    url: "https://letsbit.io",
    custodial: true,
    btcOnchain: true,
    lightning: false,
    lightningAddress: false,
    criptoyaKey: "letsbit",
  },
  {
    key: "tiendacrypto",
    name: "Tienda Crypto",
    url: "https://tiendacrypto.com",
    custodial: true,
    btcOnchain: true,
    lightning: false,
    lightningAddress: false,
    criptoyaKey: "tiendacrypto",
  },
  {
    key: "prex",
    name: "Prex",
    url: "https://prexcard.com",
    custodial: true,
    btcOnchain: true,
    lightning: false,
    lightningAddress: false,
  },
];
