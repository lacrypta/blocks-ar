"use client";

import { useMemo, useState } from "react";
import { useBrokers } from "@/hooks/useBrokers";
import { useDollars } from "@/hooks/useDollars";
import { useExchangeStats } from "@/hooks/useExchangeStats";
import {
  useBrokerIndicators,
  type IndicatorPrefs,
} from "@/hooks/useBrokerIndicators";
import {
  BROKER_LIMIT_OPTIONS,
  useBrokerRankingSettings,
} from "@/hooks/useBrokerRankingSettings";
import { Card, CardTitle } from "@/components/ui/Card";
import { BrokerLogo } from "./BrokerLogo";
import { IndicatorMenu } from "./IndicatorMenu";
import {
  BitcoinerBadge,
  ExchangeDetailDialog,
  type ExchangeDetailData,
} from "@/components/exchanges/ExchangeDetailDialog";
import { brokerName } from "@/lib/data/brokerNames";
import { brokerUrl } from "@/lib/data/brokerUrls";
import { AR_EXCHANGES, type ArExchange } from "@/lib/data/arExchanges";
import { isProxyFeed, listBrokerPriceSources } from "@/lib/data/priceSource";
import { OFFICIAL_PROVIDER_KEYS } from "@/lib/api/official/meta";
import { fmtArs, fmtPct, fmtNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { BrokerQuote } from "@/lib/api/criptoya";

type Dir = 1 | -1 | 0;

interface Row {
  key: string;
  price: number;
  /** Curated Bitcoiner Index entry, when this price feed maps to an exchange. */
  exchange?: ArExchange;
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
  skeletonCount,
  onSelect,
}: {
  title: string;
  hint: string;
  rows: Row[];
  loading: boolean;
  prefs: IndicatorPrefs;
  dirs: Record<string, Dir>;
  side: "a" | "b";
  skeletonCount: number;
  onSelect: (key: string) => void;
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
          Array.from({ length: skeletonCount }).map((_, i) => (
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
          const rowClassName = cn(
            "relative flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-fg transition-colors",
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
                <span
                  className="pointer-events-auto relative z-10 inline-flex cursor-pointer"
                  onClick={() => onSelect(r.key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(r.key);
                    }
                  }}
                >
                  {r.exchange ? (
                    <BitcoinerBadge exchange={r.exchange} />
                  ) : (
                    <span
                      aria-label="Nivel Bitcoiner sin datos"
                      title="Todavía no está en el índice Bitcoiner curado."
                      className="inline-flex min-w-12 items-center justify-center rounded-full bg-surface-2 px-2 py-1 text-[11px] font-semibold text-muted tabular-nums"
                    >
                      —/10
                    </span>
                  )}
                </span>
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
            <li key={r.key} className={rowClassName}>
              <button
                type="button"
                onClick={() => onSelect(r.key)}
                aria-haspopup="dialog"
                aria-label={`Ver detalle y fuente de precio de ${name}`}
                className="absolute inset-0 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
              <span className="pointer-events-none relative z-[1] flex w-full items-center gap-2">
                {rowContent}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function LimitControl({
  limit,
  onChange,
}: {
  limit: number;
  onChange: (limit: number) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3 text-[11px] text-muted">
      <span>Mostrar top</span>
      <div className="glass-pill inline-flex h-8 items-center overflow-hidden rounded-lg border p-0.5">
        {BROKER_LIMIT_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={limit === option}
            className={cn(
              "h-6 rounded-md px-2.5 text-[11px] font-semibold tabular-nums transition-colors",
              limit === option
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:bg-white/20 hover:text-fg dark:hover:bg-white/5",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BrokerRankingTable() {
  const { data, isLoading, isError } = useBrokers();
  const { data: dollars } = useDollars();
  const { reference: bitstamp } = useExchangeStats();
  const { prefs, toggle } = useBrokerIndicators();
  const { settings, setLimit } = useBrokerRankingSettings();
  const hasNexoAlias = (data ?? []).some((quote) => quote.key === "buenbit");
  const limit = settings.limit;

  const usdtRate = dollars?.cripto?.value;
  // How many rows are served by the exchange's own API rather than the aggregate.
  const officialCount = `${OFFICIAL_PROVIDER_KEYS.length} exchanges`;

  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const quotesByKey = useMemo(() => {
    const map = new Map<string, BrokerQuote>();
    for (const q of data ?? []) map.set(q.key, q);
    return map;
  }, [data]);

  // Reverse-map a broker's CriptoYa key to its curated entry (support +
  // bitcoiner level). Proxy exchanges are skipped so a borrowed feed (e.g.
  // "buenbit") never mislabels itself as the borrower (Nexo).
  const curatedByBrokerKey = useMemo(() => {
    const map = new Map<string, ArExchange>();
    for (const e of AR_EXCHANGES) {
      if (isProxyFeed(e.key)) continue;
      const key = e.key === "bullbitcoin" ? "bullbitcoin" : e.criptoyaKey;
      if (key) map.set(key, e);
    }
    return map;
  }, []);

  const selectedDetail: ExchangeDetailData | null = useMemo(() => {
    if (!selectedKey) return null;
    return {
      name: brokerName(selectedKey),
      logoKey: selectedKey,
      url: brokerUrl(selectedKey),
      custodial: curatedByBrokerKey.get(selectedKey)?.custodial,
      sources: listBrokerPriceSources(selectedKey),
      quote: quotesByKey.get(selectedKey),
      exchange: curatedByBrokerKey.get(selectedKey) ?? null,
    };
  }, [selectedKey, curatedByBrokerKey, quotesByKey]);

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
      .map((q) => ({
        key: q.key,
        price: q.totalAsk,
        exchange: curatedByBrokerKey.get(q.key),
        ...indicators(q.totalAsk),
      }));
    const sell = quotes
      .filter((q) => q.totalBid > 0)
      .sort((a, b) => b.totalBid - a.totalBid) // highest to sell first
      .map((q) => ({
        key: q.key,
        price: q.totalBid,
        exchange: curatedByBrokerKey.get(q.key),
        ...indicators(q.totalBid),
      }));
    return { buy, sell };
  }, [data, usdtRate, bitstamp, curatedByBrokerKey]);

  const visibleBuy = buy.slice(0, limit);
  const visibleSell = sell.slice(0, limit);

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
            rows={visibleBuy}
            loading={isLoading}
            prefs={prefs}
            dirs={dirs}
            side="a"
            skeletonCount={limit}
            onSelect={setSelectedKey}
          />
          <Column
            title="Vender"
            hint="mejor pago primero ↓"
            rows={visibleSell}
            loading={isLoading}
            prefs={prefs}
            dirs={dirs}
            side="b"
            skeletonCount={limit}
            onSelect={setSelectedKey}
          />
        </div>
      )}

      {!isError && <LimitControl limit={limit} onChange={setLimit} />}

      <p className="mt-3 text-[11px] text-muted">
        Precios finales con comisiones incluidas · fuente CriptoYa, con la API
        oficial del exchange cuando publica una comparable ({officialCount}).
        {hasNexoAlias && " · Nexo muestra precios del feed de Buenbit vía CriptoYa."}
        {prefs.usdt && " · USDT = precio del BTC en USDT."}
        {prefs.difBitstamp && " · Dif. = premium vs Bitstamp."}
      </p>

      <ExchangeDetailDialog
        data={selectedDetail}
        onClose={() => setSelectedKey(null)}
      />
    </Card>
  );
}
