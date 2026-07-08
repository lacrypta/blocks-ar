/** Pretty display names for CriptoYa broker keys. Falls back to a capitalized key. */
const NAMES: Record<string, string> = {
  buenbit: "Buenbit",
  ripio: "Ripio",
  satoshitango: "SatoshiTango",
  universalcoins: "Universal Coins",
  decrypto: "Decrypto",
  letsbit: "Letsbit",
  fiwind: "Fiwind",
  lemoncash: "Lemon",
  belo: "Belo",
  tiendacrypto: "Tienda Crypto",
  saldo: "Saldo",
  pluscrypto: "Plus Crypto",
  cocoscrypto: "Cocos Crypto",
  bitsoalpha: "Bitso",
  cryptomktpro: "CryptoMKT Pro",
  eluter: "Eluter",
  vitawallet: "Vita Wallet",
  binance: "Binance",
  binancep2p: "Binance P2P",
  okexp2p: "OKX P2P",
  huobip2p: "Huobi P2P",
  bybit: "Bybit",
  bybitp2p: "Bybit P2P",
  kucoinp2p: "KuCoin P2P",
  bitgetp2p: "Bitget P2P",
  mexcp2p: "MEXC P2P",
  prex: "Prex",
  trubit: "TruBit",
};

export function brokerName(key: string): string {
  return NAMES[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}
