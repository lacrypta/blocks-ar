"use client";

import { useBitstampMarket } from "@/hooks/useBitstampMarket";
import { useExchangeStore } from "@/store/useExchangeStore";
import { Card, CardTitle } from "@/components/ui/Card";
import { StatusDot } from "@/components/ui/StatusDot";
import { cn } from "@/lib/cn";
import { fmtPct, fmtUsd, timeAgo } from "@/lib/format";

const pctFrom = (current?: number, base?: number) =>
  current !== undefined && base !== undefined && base > 0
    ? ((current - base) / base) * 100
    : undefined;

function TrendPill({ label, value }: { label: string; value?: number }) {
  const positive = (value ?? 0) >= 0;

  return (
    <div className="glass-card-soft rounded-xl border px-3 py-2">
      <span className="block text-[11px] font-medium text-muted">{label}</span>
      <span
        className={cn(
          "mt-1 block font-mono text-sm font-semibold tabular-nums",
          value === undefined ? "text-muted" : positive ? "text-up" : "text-down",
        )}
      >
        {fmtPct(value)}
      </span>
    </div>
  );
}

function FearGreedMeter({
  value,
  label,
}: {
  value?: number;
  label?: string;
}) {
  const clamped =
    value !== undefined && Number.isFinite(value)
      ? Math.min(100, Math.max(0, value))
      : undefined;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-muted">Fear & Greed</span>
        <span className="font-mono text-sm font-semibold tabular-nums">
          {clamped !== undefined ? clamped : "—"}/100
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-down via-gold to-up transition-[width]"
          style={{ width: `${clamped ?? 0}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
        <span className="text-muted">{label ?? "Sin datos"}</span>
        <span className="text-muted">miedo → codicia</span>
      </div>
    </div>
  );
}

export function BitstampMarketWidget() {
  const bitstampFeed = useExchangeStore((s) => s.feeds.bitstamp);
  const { data, isError } = useBitstampMarket();

  const livePrice = bitstampFeed.price;
  const fallbackPrice = data?.bitstamp?.latestClose;
  const currentPrice = livePrice ?? fallbackPrice;
  const updatedAt = bitstampFeed.updatedAt ?? data?.bitstamp?.latestAt;
  const online = bitstampFeed.status === "online";

  const trend1h = pctFrom(currentPrice, data?.bitstamp?.oneHourAgo);
  const trend24h = pctFrom(currentPrice, data?.bitstamp?.dayAgo);
  const trend7d = pctFrom(currentPrice, data?.bitstamp?.weekAgo);

  return (
    <Card>
      <CardTitle
        id="precio"
        right={
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <StatusDot online={online} pulse={online} />
            {online ? "en vivo" : "conectando"}
          </span>
        }
      >
        Bitstamp BTC/USD
      </CardTitle>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Precio spot
          </div>
          <div className="mt-1 font-mono text-4xl font-bold tabular-nums text-fg">
            {fmtUsd(currentPrice, true)}
          </div>
          <div className="mt-1 text-xs text-muted">
            {updatedAt ? `actualizado ${timeAgo(updatedAt)}` : "esperando feed"}
          </div>
        </div>

        <div className="glass-card-soft rounded-xl border px-3 py-2 text-right">
          <div className="text-[11px] font-medium text-muted">Fuente</div>
          <div className="mt-1 text-sm font-semibold">Bitstamp</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <TrendPill label="1hr" value={trend1h} />
        <TrendPill label="24hs" value={trend24h} />
        <TrendPill label="Semanal" value={trend7d} />
      </div>

      <FearGreedMeter
        value={data?.fearGreed?.value}
        label={data?.fearGreed?.classificationEs ?? data?.fearGreed?.classification}
      />

      {isError && (
        <div className="mt-3 text-xs text-down">
          No se pudo cargar tendencia o Fear & Greed.
        </div>
      )}
    </Card>
  );
}
