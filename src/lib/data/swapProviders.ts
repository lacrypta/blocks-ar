/**
 * Sat → fiat/stablecoin off-ramp routing (UI mock).
 *
 * Fees, spreads and limits are placeholders shaped like the real provider
 * quotes so the flow can be wired to live endpoints later:
 *  - Wapu / Bull Bitcoin → ARS payouts (bank transfer)
 *  - Boltz → trustless swaps to on-chain BTC, L-BTC and Liquid stablecoins
 */

export type ProviderKey = "wapu" | "bullbitcoin" | "boltz";

/** Where the user receives the funds. */
export type PayoutKind = "bank" | "crypto";

export interface SwapCurrency {
  code: string;
  /** Human label shown in the selector. */
  label: string;
  /** Settlement rail, e.g. "Transferencia CBU/CVU" or "Liquid". */
  network: string;
  kind: PayoutKind;
  decimals: number;
  /** Symbol shown next to the amount. */
  symbol?: string;
  group: "fiat" | "stable" | "bitcoin";
}

export const SWAP_CURRENCIES: SwapCurrency[] = [
  {
    code: "ARS",
    label: "Peso argentino",
    network: "Transferencia CBU / CVU",
    kind: "bank",
    decimals: 2,
    symbol: "$",
    group: "fiat",
  },
  {
    code: "USDT",
    label: "Tether",
    network: "Liquid",
    kind: "crypto",
    decimals: 2,
    group: "stable",
  },
  {
    code: "USDC",
    label: "USD Coin",
    network: "Liquid",
    kind: "crypto",
    decimals: 2,
    group: "stable",
  },
  {
    code: "BTC",
    label: "Bitcoin on-chain",
    network: "Bitcoin mainnet",
    kind: "crypto",
    decimals: 8,
    group: "bitcoin",
  },
  {
    code: "L-BTC",
    label: "Liquid Bitcoin",
    network: "Liquid",
    kind: "crypto",
    decimals: 8,
    group: "bitcoin",
  },
];

export interface SwapProvider {
  key: ProviderKey;
  name: string;
  tagline: string;
  /** Currency codes this provider can settle. */
  supports: string[];
  /** Service fee over the swapped amount. */
  feePct: number;
  /** Rate haircut vs. the market reference. */
  spreadPct: number;
  /** Flat network/claim cost, charged in sats. */
  fixedFeeSats: number;
  minSats: number;
  maxSats: number;
  etaLabel: string;
  custody: "non-custodial" | "custodial";
  kyc: "sin KYC" | "KYC liviano" | "KYC completo";
  url: string;
  /** Payout field copy, per provider. */
  payoutLabel: string;
  payoutPlaceholder: string;
  payoutHint: string;
}

export const SWAP_PROVIDERS: Record<ProviderKey, SwapProvider> = {
  wapu: {
    key: "wapu",
    name: "Wapu",
    tagline: "Lightning → pesos, alias o CBU propio",
    supports: ["ARS"],
    feePct: 0.9,
    spreadPct: 0.4,
    fixedFeeSats: 0,
    minSats: 5_000,
    maxSats: 12_000_000,
    etaLabel: "Instantáneo (24/7)",
    custody: "non-custodial",
    kyc: "KYC liviano",
    url: "https://wapu.io",
    payoutLabel: "Alias o CBU/CVU",
    payoutPlaceholder: "lacrypta.wapu",
    payoutHint: "La cuenta debe estar a tu nombre.",
  },
  bullbitcoin: {
    key: "bullbitcoin",
    name: "Bull Bitcoin",
    tagline: "Off-ramp con liquidación bancaria en ARS",
    supports: ["ARS"],
    feePct: 1.4,
    spreadPct: 0.6,
    fixedFeeSats: 0,
    minSats: 20_000,
    maxSats: 60_000_000,
    etaLabel: "Hábiles, hasta 2 h",
    custody: "custodial",
    kyc: "KYC completo",
    url: "https://bullbitcoin.com",
    payoutLabel: "CBU / CVU",
    payoutPlaceholder: "0000003100000000000000",
    payoutHint: "22 dígitos, titularidad verificada.",
  },
  boltz: {
    key: "boltz",
    name: "Boltz",
    tagline: "Submarine swaps sin custodia ni cuenta",
    supports: ["USDT", "USDC", "BTC", "L-BTC"],
    feePct: 0.1,
    spreadPct: 0.05,
    fixedFeeSats: 340,
    minSats: 1_000,
    maxSats: 25_000_000,
    etaLabel: "1 confirmación (~1 min)",
    custody: "non-custodial",
    kyc: "sin KYC",
    url: "https://boltz.exchange",
    payoutLabel: "Dirección de destino",
    payoutPlaceholder: "lq1qq… / bc1q…",
    payoutHint: "Verificá la red antes de confirmar.",
  },
};

/** Providers that can settle a currency, in routing preference order. */
export function providersFor(code: string): SwapProvider[] {
  return (["wapu", "bullbitcoin", "boltz"] as ProviderKey[])
    .map((k) => SWAP_PROVIDERS[k])
    .filter((p) => p.supports.includes(code));
}

export function currencyByCode(code: string): SwapCurrency {
  return SWAP_CURRENCIES.find((c) => c.code === code) ?? SWAP_CURRENCIES[0];
}

export interface MarketRates {
  /** BTC price in ARS. */
  btcArs?: number;
  /** BTC price in USD. */
  btcUsd?: number;
}

/** Market units received per 1 BTC, before provider spread. */
export function referenceRate(
  code: string,
  rates: MarketRates,
): number | undefined {
  switch (code) {
    case "ARS":
      return rates.btcArs;
    case "USDT":
    case "USDC":
      return rates.btcUsd;
    case "BTC":
    case "L-BTC":
      return 1;
    default:
      return undefined;
  }
}

export interface SwapQuote {
  provider: SwapProvider;
  currency: SwapCurrency;
  sats: number;
  /** Rate after the provider spread, in units per BTC. */
  rate?: number;
  /** Amount the user receives in the destination currency. */
  receive?: number;
  /** Total cost in sats (service fee + flat network fee). */
  feeSats: number;
  /** Total cost as a share of the input. */
  feePct: number;
  belowMin: boolean;
  aboveMax: boolean;
  /** Quotable: amount inside limits and a live reference rate exists. */
  ok: boolean;
}

const SATS_PER_BTC = 100_000_000;

export function quote(
  provider: SwapProvider,
  currency: SwapCurrency,
  sats: number,
  rates: MarketRates,
): SwapQuote {
  const reference = referenceRate(currency.code, rates);
  const rate =
    reference === undefined
      ? undefined
      : reference * (1 - provider.spreadPct / 100);

  const serviceFee = Math.round((sats * provider.feePct) / 100);
  const feeSats = Math.min(sats, serviceFee + provider.fixedFeeSats);
  const netSats = Math.max(0, sats - feeSats);

  const belowMin = sats > 0 && sats < provider.minSats;
  const aboveMax = sats > provider.maxSats;
  const ok = sats > 0 && !belowMin && !aboveMax && rate !== undefined;

  return {
    provider,
    currency,
    sats,
    rate,
    receive: rate === undefined ? undefined : (netSats / SATS_PER_BTC) * rate,
    feeSats,
    feePct: sats > 0 ? (feeSats / sats) * 100 : 0,
    belowMin,
    aboveMax,
    ok,
  };
}

/** All routes for a currency, best payout first. */
export function routesFor(
  code: string,
  sats: number,
  rates: MarketRates,
): SwapQuote[] {
  const currency = currencyByCode(code);
  return providersFor(code)
    .map((p) => quote(p, currency, sats, rates))
    .sort((a, b) => {
      if (a.ok !== b.ok) return a.ok ? -1 : 1;
      return (b.receive ?? 0) - (a.receive ?? 0);
    });
}

/** Amount formatter that handles both fiat and 8-decimal crypto. */
export function fmtDestination(value: number | undefined, c: SwapCurrency) {
  if (value === undefined || !Number.isFinite(value)) return "—";
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: c.decimals === 8 ? 8 : 2,
    maximumFractionDigits: c.decimals,
  }).format(value);
  return c.symbol ? `${c.symbol}${formatted}` : `${formatted} ${c.code}`;
}

/** Deterministic-looking mock BOLT11 invoice for the payment step. */
export function mockInvoice(sats: number) {
  const alphabet = "023456789acdefghjklmnpqrstuvwxyz";
  let body = "";
  for (let i = 0; i < 108; i += 1) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `lnbc${sats}n1p${body}`;
}
