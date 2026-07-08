"use client";

import { useSyncExternalStore } from "react";

/** Widget ids in their default order. The registry maps each id to a component. */
export const DEFAULT_ORDER = [
  "paridad",
  "exchanges-intl",
  "dolares",
  "red",
  "brokers",
  "exchanges-ar",
] as const;

const KNOWN = new Set<string>(DEFAULT_ORDER);
const STORAGE_KEY = "blocksar:widget-layout";

export interface WidgetLayoutState {
  order: string[];
  hidden: string[];
  editMode: boolean;
}

// order + hidden persist; editMode is transient (session-only).
let order: string[] = [...DEFAULT_ORDER];
let hidden: string[] = [];
let editMode = false;
let hydrated = false;

const SERVER_SNAPSHOT: WidgetLayoutState = {
  order: [...DEFAULT_ORDER],
  hidden: [],
  editMode: false,
};
let snapshot: WidgetLayoutState = SERVER_SNAPSHOT;

const listeners = new Set<() => void>();

function rebuild() {
  snapshot = { order, hidden, editMode };
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ order, hidden }));
  } catch {
    // ignore write errors
  }
}

function reconcile(storedOrder: string[], storedHidden: string[]) {
  // Drop unknown ids, append any newly-added widgets at the end.
  const filtered = storedOrder.filter((id) => KNOWN.has(id));
  const appended = DEFAULT_ORDER.filter((id) => !filtered.includes(id));
  order = [...filtered, ...appended];
  hidden = storedHidden.filter((id) => KNOWN.has(id));
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<{
        order: string[];
        hidden: string[];
      }>;
      reconcile(parsed.order ?? [...DEFAULT_ORDER], parsed.hidden ?? []);
      rebuild();
    }
  } catch {
    // ignore malformed storage
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): WidgetLayoutState {
  hydrate();
  return snapshot;
}

function getServerSnapshot(): WidgetLayoutState {
  return SERVER_SNAPSHOT;
}

function setOrder(next: string[]) {
  order = next;
  rebuild();
  persist();
  emit();
}

function toggleHidden(id: string) {
  hidden = hidden.includes(id)
    ? hidden.filter((x) => x !== id)
    : [...hidden, id];
  rebuild();
  persist();
  emit();
}

function setEditMode(value: boolean) {
  editMode = value;
  rebuild();
  emit();
}

function reset() {
  order = [...DEFAULT_ORDER];
  hidden = [];
  rebuild();
  persist();
  emit();
}

export function useWidgetLayout() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { ...state, setOrder, toggleHidden, setEditMode, reset };
}
