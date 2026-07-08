export const SATS_PER_BTC = 100_000_000;

/** Value of 1 satoshi in ARS given the BTC price in ARS. */
export const satToArs = (btcArs: number) => btcArs / SATS_PER_BTC;

/**
 * Progress toward the historic "1 SAT = 1 ARS" parity.
 * Equals `satToArs` numerically: reaches 1.0 when 1 BTC = 100.000.000 ARS.
 */
export const parityRatio = (btcArs: number) => btcArs / SATS_PER_BTC;

/** ARS the BTC price must still move to hit 1 SAT = 1 ARS (positive = up). */
export const arsToReach1to1 = (btcArs: number) => SATS_PER_BTC - btcArs;
