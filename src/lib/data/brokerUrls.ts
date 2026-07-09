import { brokerPresentationAlias } from "./brokerPresentation";

/** Official broker/exchange websites for CriptoYa broker keys. */
const URLS: Record<string, string> = {
  belo: "https://www.belo.app/",
  binance: "https://www.binance.com/",
  binancep2p: "https://p2p.binance.com/en",
  bitgetp2p: "https://www.bitget.com/asia/p2p-trade",
  bitsoalpha: "https://bitso.com/",
  bullbitcoin: "https://www.bullbitcoin.com/",
  buenbit: "https://buenbit.com/",
  bybit: "https://www.bybit.com/",
  bybitp2p: "https://www.bybit.com/p2p/",
  cocoscrypto: "https://www.cocos.capital/crypto",
  cryptomktpro: "https://www.cryptomkt.com/",
  decrypto: "https://www.decrypto.la/",
  eluter: "https://eluter.com/",
  fiwind: "https://www.fiwind.io/",
  huobip2p: "https://www.htx.com/",
  kucoinp2p: "https://www.kucoin.com/otc/buy/USDT-USD",
  lemoncash: "https://lemon.me/",
  letsbit: "https://letsbit.io/",
  mexcp2p: "https://www.mexc.com/buy-crypto/p2p",
  nexo: "https://www.nexo.com/",
  okexp2p: "https://www.okx.com/p2p-markets",
  pluscrypto: "https://pluscrypto.com.ar/",
  prex: "https://www.prexcard.com.ar/",
  ripio: "https://www.ripio.com/",
  saldo: "https://saldo.com.ar/",
  satoshitango: "https://www.satoshitango.com/",
  tiendacrypto: "https://tiendacrypto.com/",
  trubit: "https://www.trubit.com/",
  universalcoins: "https://www.universalcoins.com/",
  vitawallet: "https://vitawallet.io/",
};

export function brokerUrl(key: string): string | undefined {
  return brokerPresentationAlias(key)?.displayUrl ?? URLS[key];
}
