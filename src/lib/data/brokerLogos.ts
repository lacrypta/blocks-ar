/**
 * Broker keys that have a bundled logo under /public/brokers/{key}.png.
 * Keep this in sync with the files on disk. Any broker NOT in this set
 * renders the initial-letter avatar directly (no 404 image request).
 */
export const BROKER_LOGO_KEYS: ReadonlySet<string> = new Set([
  "belo",
  "binance",
  "binancep2p",
  "bitgetp2p",
  "bitsoalpha",
  "bullbitcoin",
  "buenbit",
  "bybit",
  "bybitp2p",
  "cocoscrypto",
  "cryptomktpro",
  "decrypto",
  "eluter",
  "fiwind",
  "kucoinp2p",
  "lemoncash",
  "letsbit",
  "mexcp2p",
  "okexp2p",
  "pluscrypto",
  "prex",
  "ripio",
  "saldo",
  "satoshitango",
  "tiendacrypto",
  "trubit",
  "universalcoins",
  "vitawallet",
]);
