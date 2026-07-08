import rawArExchanges from "./arExchanges.json";

export type Support = boolean;
export type BitcoinerSupport = boolean;

export const BITCOINER_FEATURE_KEYS = [
  "onchain",
  "lightning",
  "lightningAddressOut",
  "lightningAddressIn",
  "api",
  "selfCustody",
  "nonMandatoryKyc",
  "openSourceContributions",
  "bitcoinOnly",
  "noCryptoOnlyStablecoins",
] as const;

export type BitcoinerFeatureKey = (typeof BITCOINER_FEATURE_KEYS)[number];

export const BITCOINER_FEATURE_DETAILS: Record<
  BitcoinerFeatureKey,
  { description: string; label: string }
> = {
  onchain: {
    label: "On-chain",
    description: "Permite depositar o retirar BTC on-chain.",
  },
  lightning: {
    label: "Lightning",
    description: "Permite operar BTC por Lightning Network.",
  },
  lightningAddressOut: {
    label: "LN Address out",
    description: "Puede enviar pagos a una Lightning Address externa.",
  },
  lightningAddressIn: {
    label: "LN Address in",
    description: "Puede recibir con su propia Lightning Address.",
  },
  api: {
    label: "API",
    description: "Ofrece una API pública o documentada para integraciones.",
  },
  selfCustody: {
    label: "Self-custody",
    description: "Prioriza flujos no custodiales o de autocustodia.",
  },
  nonMandatoryKyc: {
    label: "KYC no obligatorio",
    description: "Permite operar algún flujo útil sin KYC obligatorio.",
  },
  openSourceContributions: {
    label: "Open source",
    description: "Contribuye de forma visible a Bitcoin o software abierto.",
  },
  bitcoinOnly: {
    label: "Bitcoin only",
    description: "El producto se enfoca exclusivamente en Bitcoin.",
  },
  noCryptoOnlyStablecoins: {
    label: "Sin altcoins",
    description: "No promueve altcoins; a lo sumo suma stablecoins.",
  },
};

export interface BitcoinerLevel {
  onchain: BitcoinerSupport;
  lightning: BitcoinerSupport;
  lightningAddressOut: BitcoinerSupport;
  lightningAddressIn: BitcoinerSupport;
  api: BitcoinerSupport;
  selfCustody: BitcoinerSupport;
  nonMandatoryKyc: BitcoinerSupport;
  openSourceContributions: BitcoinerSupport;
  bitcoinOnly: BitcoinerSupport;
  noCryptoOnlyStablecoins: BitcoinerSupport;
}

export interface ArExchange {
  key: string;
  name: string;
  url: string;
  /** Custodial (exchange holds keys) vs non-custodial. */
  custodial: boolean;
  btcOnchain: Support;
  lightning: Support;
  /** Supports paying a third-party Lightning Address (user@domain). */
  lightningAddressOut: Support;
  /** Supports owning/receiving to a Lightning Address. */
  lightningAddressIn: Support;
  bitcoiner: BitcoinerLevel;
  /** Matching CriptoYa broker key, if it publishes BTC/ARS prices. */
  criptoyaKey?: string;
  notes?: string;
}

export const AR_EXCHANGES_GITHUB_EDIT_URL =
  "https://github.com/lacrypta/blocks-ar/edit/main/src/lib/data/arExchanges.json";

/**
 * Rank exchanges by Bitcoin/Lightning support depth.
 * We favor richer Lightning support over plain on-chain support:
 * BTC on-chain < Lightning < Lightning Address.
 */
export function exchangeSupportRank(exchange: ArExchange): number {
  return (
    Number(exchange.btcOnchain) +
    Number(exchange.lightning) * 2 +
    Number(exchange.lightningAddressIn) * 4
  );
}

export function bitcoinerLevel(exchange: ArExchange): number {
  return BITCOINER_FEATURE_KEYS.reduce(
    (score, key) => score + Number(exchange.bitcoiner[key]),
    0,
  );
}

export function bitcoinerFeatures(exchange: ArExchange): string[] {
  return BITCOINER_FEATURE_KEYS.filter((key) => exchange.bitcoiner[key]).map(
    (key) => BITCOINER_FEATURE_DETAILS[key].label,
  );
}

export const AR_EXCHANGES: ArExchange[] = rawArExchanges as ArExchange[];
