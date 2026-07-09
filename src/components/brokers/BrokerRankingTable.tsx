"use client";

import { useMemo, useState } from "react";
import { useBrokers } from "@/hooks/useBrokers";
import { useDollars } from "@/hooks/useDollars";
import { useExchangeStats } from "@/hooks/useExchangeStats";
import {
  useBrokerIndicators,
  type IndicatorPrefs,
} from "@/hooks/useBrokerIndicators";
import { Card, CardTitle } from "@/components/ui/Card";
import { BrokerLogo } from "./BrokerLogo";
import { IndicatorMenu } from "./IndicatorMenu";
import { brokerName } from "@/lib/data/brokerNames";
import { brokerUrl } from "@/lib/data/brokerUrls";
import { fmtArs, fmtPct, fmtNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { BrokerQuote } from "@/lib/api/criptoya";

type Dir = 1 | -1 | 0;

interface Row {
  key: string;
  price: number;
  /** BTC price expressed in USDT (price / USDT rate). */
  usdt?: number;
  /** % premium over Bitstamp international price. */
  dif?: number;
}

function Arrow({ dir }: { dir: Dir }) {
  return (
    <span
      className={cn(
        "w-3 shrink-0 text-center text-[11px]",
        dir === 1 ? "text-up" : dir === -1 ? "text-down" : "text-muted",
      )}
    >
      {dir === 1 ? "▲" : dir === -1 ? "▼" : "·"}
    </span>
  );
}

function Column({
  title,
  hint,
  rows,
  loading,
  prefs,
  dirs,
  side,
}: {
  title: string;
  hint: string;
  rows: Row[];
  loading: boolean;
  prefs: IndicatorPrefs;
  dirs: Record<string, Dir>;
  side: "a" | "b";
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-bold">{title}</h3>
        <span className="text-[11px] text-muted">{hint}</span>
      </div>
      <ol className="flex flex-col gap-0.5">
        {loading &&
          rows.length === 0 &&
          Array.from({ length: 24 }).map((_, i) => (
            <li key={i} className="px-2 py-1.5">
              <div className="h-5 w-full animate-pulse rounded bg-surface-2" />
            </li>
          ))}

        {!loading && rows.length === 0 && (
          <li className="px-2 py-6 text-center text-sm text-muted">
            Sin datos
          </li>
        )}

        {rows.map((r, i) => {
          const best = i === 0;
          const name = brokerName(r.key);
          const url = brokerUrl(r.key);
          const rowClassName = cn(
            "flex items-center gap-2 rounded-lg px-2 py-1.5 text-fg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            best ? "bg-up/10 ring-1 ring-up/30" : "hover:bg-surface-2/50",
          );
          const rowContent = (
            <>
              <span className="w-4 shrink-0 text-center text-xs text-muted tabular-nums">
                {i + 1}
              </span>
              <BrokerLogo brokerKey={r.key} />
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate text-sm font-medium">{name}</span>
                {best && (
                  <span className="shrink-0 rounded bg-up/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-up">
                    Mejor
                  </span>
                )}
              </span>

              {prefs.difBitstamp && (
                <span className="w-12 shrink-0 text-right text-[11px] text-muted tabular-nums">
                  {r.dif !== undefined ? fmtPct(r.dif) : "—"}
                </span>
              )}
              {prefs.usdt && (
                <span className="w-14 shrink-0 text-right text-[11px] text-muted tabular-nums">
                  {r.usdt !== undefined ? fmtNumber(r.usdt) : "—"}
                </span>
              )}
              {prefs.subeBaja && <Arrow dir={dirs[`${side}:${r.key}`] ?? 0} />}

              <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                {fmtArs(r.price)}
              </span>
            </>
          );

          return (
            <li key={r.key}>
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Abrir sitio oficial de ${name}`}
                  className={rowClassName}
                >
                  {rowContent}
                </a>
              ) : (
                <div className={rowClassName}>{rowContent}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function BrokerRankingTable() {
  const { data, isLoading, isError } = useBrokers();
  const { data: dollars } = useDollars();
  const { reference: bitstamp } = useExchangeStats();
  const { prefs, toggle } = useBrokerIndicators();
  const hasNexoAlias = (data ?? []).some((quote) => quote.key === "buenbit");

  const usdtRate = dollars?.cripto?.value;

  // Sube/baja arrow: compare current data to the previous render's data via the
  // documented "adjust state when a prop changes" pattern (setState during
  // render) — avoids effects and reading refs during render.
  const [prevData, setPrevData] = useState<BrokerQuote[]>();
  const [dirs, setDirs] = useState<Record<string, Dir>>({});

  if (data !== prevData) {
    const prevPrices: Record<string, number> = {};
    for (const q of prevData ?? []) {
      if (q.totalAsk > 0) prevPrices[`a:${q.key}`] = q.totalAsk;
      if (q.totalBid > 0) prevPrices[`b:${q.key}`] = q.totalBid;
    }
    const nextDirs: Record<string, Dir> = {};
    for (const q of data ?? []) {
      const sides: [string, number][] = [
        [`a:${q.key}`, q.totalAsk],
        [`b:${q.key}`, q.totalBid],
      ];
      for (const [id, price] of sides) {
        if (price > 0) {
          const p = prevPrices[id];
          nextDirs[id] =
            p === undefined ? 0 : price > p ? 1 : price < p ? -1 : 0;
        }
      }
    }
    setPrevData(data);
    setDirs(nextDirs);
  }

  const { buy, sell } = useMemo(() => {
    const quotes: BrokerQuote[] = data ?? [];
    const indicators = (price: number): Pick<Row, "usdt" | "dif"> => {
      const usdt = usdtRate && usdtRate > 0 ? price / usdtRate : undefined;
      const dif =
        usdt !== undefined && bitstamp && bitstamp > 0
          ? (usdt / bitstamp - 1) * 100
          : undefined;
      return { usdt, dif };
    };
    const buy = quotes
      .filter((q) => q.totalAsk > 0)
      .sort((a, b) => a.totalAsk - b.totalAsk) // cheapest to buy first
      .map((q) => ({ key: q.key, price: q.totalAsk, ...indicators(q.totalAsk) }));
    const sell = quotes
      .filter((q) => q.totalBid > 0)
      .sort((a, b) => b.totalBid - a.totalBid) // highest to sell first
      .map((q) => ({ key: q.key, price: q.totalBid, ...indicators(q.totalBid) }));
    return { buy, sell };
  }, [data, usdtRate, bitstamp]);

  return (
    <Card>
      <CardTitle
        id="brokers"
        right={<IndicatorMenu prefs={prefs} onToggle={toggle} />}
      >
        Brokers argentinos — mejores precios
      </CardTitle>

      {isError ? (
        <p className="py-6 text-center text-sm text-down">
          No se pudieron cargar los precios.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          <Column
            title="Comprar"
            hint="más barato primero ↓"
            rows={buy}
            loading={isLoading}
            prefs={prefs}
            dirs={dirs}
            side="a"
          />
          <Column
            title="Vender"
            hint="mejor pago primero ↓"
            rows={sell}
            loading={isLoading}
            prefs={prefs}
            dirs={dirs}
            side="b"
          />
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted">
        Precios finales con comisiones incluidas · fuente CriptoYa + Bull
        Bitcoin.
        {hasNexoAlias && " · Nexo muestra precios del feed de Buenbit vía CriptoYa."}
        {prefs.usdt && " · USDT = precio del BTC en USDT."}
        {prefs.difBitstamp && " · Dif. = premium vs Bitstamp."}
      </p>
    </Card>
  );
}
