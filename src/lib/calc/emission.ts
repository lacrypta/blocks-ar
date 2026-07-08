const HALVING_INTERVAL = 210_000;
const INITIAL_SUBSIDY = 50;
const BLOCKS_PER_YEAR = 144 * 365;

/** Current block subsidy (BTC) for a given height. */
export function blockSubsidy(height: number): number {
  const halvings = Math.floor(height / HALVING_INTERVAL);
  if (halvings >= 64) return 0;
  return INITIAL_SUBSIDY / 2 ** halvings;
}

/** Total BTC mined up to (and including) `height`. */
export function circulatingSupply(height: number): number {
  let supply = 0;
  let remaining = height + 1; // block 0 counts
  let subsidy = INITIAL_SUBSIDY;
  while (remaining > 0 && subsidy > 0) {
    const inEpoch = Math.min(remaining, HALVING_INTERVAL);
    supply += inEpoch * subsidy;
    remaining -= inEpoch;
    subsidy /= 2;
  }
  return supply;
}

/** Annualized new-supply inflation as a percentage. */
export function annualEmissionPct(height: number): number {
  const supply = circulatingSupply(height);
  if (supply <= 0) return 0;
  const yearly = blockSubsidy(height) * BLOCKS_PER_YEAR;
  return (yearly / supply) * 100;
}
