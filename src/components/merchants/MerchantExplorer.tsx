"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  MERCHANT_CATEGORIES,
  merchantCategoryInfo,
  type Merchant,
  type MerchantCategory,
} from "@/lib/merchants/model";
import { cn } from "@/lib/cn";

const MerchantMap = dynamic(
  () => import("./MerchantMap").then((module) => module.MerchantMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[65vh] min-h-[32rem] items-center justify-center rounded-2xl border border-border bg-surface/70 text-sm text-muted">
        Cargando mapa…
      </div>
    ),
  },
);

type View = "map" | "list";

export function MerchantExplorer({ merchants }: { merchants: Merchant[] }) {
  const [view, setView] = useState<View>("map");
  const [category, setCategory] = useState<MerchantCategory>("all");
  const showList = useCallback(() => setView("list"), []);

  const counts = useMemo(() => {
    const values = Object.fromEntries(
      MERCHANT_CATEGORIES.map((item) => [item.id, 0]),
    ) as Record<MerchantCategory, number>;
    values.all = merchants.length;
    for (const merchant of merchants) values[merchant.category]++;
    return values;
  }, [merchants]);

  const visible = useMemo(
    () =>
      category === "all"
        ? merchants
        : merchants.filter((merchant) => merchant.category === category),
    [category, merchants],
  );

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="glass-pill inline-flex w-fit rounded-xl border p-1"
          aria-label="Vista de comercios"
        >
          <ViewButton active={view === "map"} onClick={() => setView("map")}>
            <MapIcon /> Mapa
          </ViewButton>
          <ViewButton active={view === "list"} onClick={() => setView("list")}>
            <ListIcon /> Lista
          </ViewButton>
        </div>

        <p className="text-sm text-muted">
          {visible.length} {visible.length === 1 ? "comercio" : "comercios"}
        </p>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-2" aria-label="Categorías">
        {MERCHANT_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={category === item.id}
            onClick={() => setCategory(item.id)}
            className={cn(
              "glass-pill inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
              category === item.id
                ? "border-bitcoin/60 bg-bitcoin/15 text-fg"
                : "text-muted hover:text-fg",
            )}
          >
            {item.id !== "all" && (
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
            )}
            {item.label}
            <span className="text-xs tabular-nums opacity-70">{counts[item.id]}</span>
          </button>
        ))}
      </div>

      {view === "map" ? (
        <MerchantMap merchants={visible} onUnsupported={showList} />
      ) : (
        <MerchantList merchants={visible} />
      )}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "relative z-10 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-bitcoin text-white shadow-sm" : "text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function MerchantList({ merchants }: { merchants: Merchant[] }) {
  if (!merchants.length) {
    return (
      <div className="glass-card rounded-2xl border p-10 text-center text-sm text-muted">
        No hay comercios en esta categoría.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {merchants.map((merchant) => {
        const category = merchantCategoryInfo(merchant.category);
        return (
          <Link
            key={merchant.id}
            href={`/comercios/${merchant.id}`}
            className="glass-card group flex min-h-32 overflow-hidden rounded-2xl border transition-transform hover:-translate-y-0.5"
          >
            <span
              className="w-1.5 shrink-0"
              style={{ backgroundColor: category.color }}
              aria-hidden="true"
            />
            <span className="relative z-10 flex min-w-0 flex-1 flex-col p-4">
              <span className="text-xs font-medium text-muted">{category.label}</span>
              <span className="mt-1 truncate font-semibold text-fg group-hover:text-bitcoin">
                {merchant.name}
              </span>
              <span className="mt-2 line-clamp-2 text-sm text-muted">
                {merchant.address ?? "Dirección no informada"}
              </span>
              <span className="mt-auto pt-3 text-xs font-medium text-bitcoin">
                Ver perfil →
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3V6Z" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 3v15M16 6v15" strokeWidth="2" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
