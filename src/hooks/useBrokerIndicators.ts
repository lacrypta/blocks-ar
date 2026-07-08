"use client";

import { useSyncExternalStore } from "react";

export interface IndicatorPrefs {
  /** % difference of the broker's USDT price vs Bitstamp (country premium). */
  difBitstamp: boolean;
  /** BTC price expressed in USDT (precio_ARS / USDT rate). */
  usdt: boolean;
  /** Up/down arrow vs the previous refresh. */
  subeBaja: boolean;
}

const DEFAULTS: IndicatorPrefs = {
  difBitstamp: true,
  usdt: false,
  subeBaja: true,
};

const STORAGE_KEY = "blocksar:broker-indicators";

// Module-level store so prefs are shared and read via useSyncExternalStore
// (avoids setState-in-effect and hydration mismatches).
let state: IndicatorPrefs = DEFAULTS;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    // ignore malformed storage
  }
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): IndicatorPrefs {
  hydrate();
  return state;
}

function getServerSnapshot(): IndicatorPrefs {
  return DEFAULTS;
}

function setPrefs(next: IndicatorPrefs) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore write errors
  }
  listeners.forEach((l) => l());
}

/** Toggleable per-row broker indicators, persisted to localStorage. */
export function useBrokerIndicators() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = (key: keyof IndicatorPrefs) =>
    setPrefs({ ...prefs, [key]: !prefs[key] });
  return { prefs, toggle };
}
