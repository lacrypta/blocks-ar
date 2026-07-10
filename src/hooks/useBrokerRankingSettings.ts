"use client";

import { useSyncExternalStore } from "react";

export const BROKER_LIMIT_OPTIONS = [5, 10, 15, 20] as const;

export interface BrokerRankingSettings {
  limit: number;
}

const DEFAULTS: BrokerRankingSettings = {
  limit: 10,
};

const STORAGE_KEY = "blocksar:broker-ranking-settings";
const listeners = new Set<() => void>();

let state: BrokerRankingSettings = DEFAULTS;
let hydrated = false;

function normalizeLimit(value: unknown) {
  return typeof value === "number" &&
    BROKER_LIMIT_OPTIONS.some((option) => option === value)
    ? value
    : DEFAULTS.limit;
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<BrokerRankingSettings>;
    state = { limit: normalizeLimit(parsed.limit) };
  } catch {
    // ignore malformed storage
  }
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  hydrate();
  return state;
}

function getServerSnapshot() {
  return DEFAULTS;
}

function setSettings(next: BrokerRankingSettings) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore write errors
  }
  listeners.forEach((listener) => listener());
}

export function useBrokerRankingSettings() {
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const setLimit = (limit: number) =>
    setSettings({ ...settings, limit: normalizeLimit(limit) });

  return { settings, setLimit };
}
