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
  source,
}: {
  value?: number;
  label?: string;
  source?: string;
}) {
  const clamped =
    value !== undefined && Number.isFinite(value)
      ? Math.min(100, Math.max(0, value))
      : undefined;

  const cx = 110;
  const cy = 112;
  const R = 88;
  // Value 0 sits at the left end (180°), value 100 at the right end (0°).
  const rad = ((180 - ((clamped ?? 0) / 100) * 180) * Math.PI) / 180;
  const needleLen = R - 18;
  const bw = 5.5;
  const tipX = cx + needleLen * Math.cos(rad);
  const tipY = cy - needleLen * Math.sin(rad);
  const blX = cx - bw * Math.sin(rad);
  const blY = cy - bw * Math.cos(rad);
  const brX = cx + bw * Math.sin(rad);
  const brY = cy + bw * Math.cos(rad);

  const ticks = [0, 25, 50, 75, 100].map((v) => {
    const tRad = ((180 - (v / 100) * 180) * Math.PI) / 180;
    const cos = Math.cos(tRad);
    const sin = Math.sin(tRad);
    return {
      v,
      x1: cx + (R + 2) * cos,
      y1: cy - (R + 2) * sin,
      x2: cx + (R + 8) * cos,
      y2: cy - (R + 8) * sin,
    };
  });

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-muted">Fear &amp; Greed</span>
        {source && (
          <span className="text-[10px] text-muted">
            vía <span className="font-semibold text-fg">{source}</span>
          </span>
        )}
      </div>
      <div className="mx-auto max-w-[170px]">
        <svg
          viewBox="0 0 220 132"
          className="w-full"
          role="img"
          aria-label={
            clamped !== undefined
              ? `Índice de miedo y codicia ${Math.round(clamped)} de 100${label ? `, ${label}` : ""}`
              : "Índice de miedo y codicia sin datos"
          }
        >
          <defs>
            <linearGradient id="fgGaugeArc" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--down)" />
              <stop offset="50%" stopColor="var(--gold)" />
              <stop offset="100%" stopColor="var(--up)" />
            </linearGradient>
          </defs>

          <path
            d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
            fill="none"
            stroke="url(#fgGaugeArc)"
            strokeWidth="13"
            strokeLinecap="round"
          />

          {ticks.map((t) => (
            <line
              key={t.v}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="var(--muted)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
            />
          ))}

          {clamped !== undefined && (
            <polygon
              points={`${tipX},${tipY} ${blX},${blY} ${brX},${brY}`}
              fill="var(--fg)"
            />
          )}
          <circle cx={cx} cy={cy} r="8" fill="var(--fg)" />
          <circle cx={cx} cy={cy} r="3.5" fill="var(--surface)" />

          <text
            x={cx}
            y="80"
            textAnchor="middle"
            fill="var(--fg)"
            style={{ fontSize: "30px", fontWeight: 800 }}
          >
            {clamped !== undefined ? Math.round(clamped) : "—"}
          </text>
          <text
            x={cx}
            y="99"
            textAnchor="middle"
            fill="var(--muted)"
            style={{ fontSize: "11px", fontWeight: 600 }}
          >
            {label ?? "Sin datos"}
          </text>

          <text
            x={cx - R}
            y="129"
            textAnchor="middle"
            fill="var(--muted)"
            style={{ fontSize: "9px" }}
          >
            miedo
          </text>
          <text
            x={cx + R}
            y="129"
            textAnchor="middle"
            fill="var(--muted)"
            style={{ fontSize: "9px" }}
          >
            codicia
          </text>
        </svg>
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
          <div className="flex items-center gap-3 text-[11px] text-muted">
            <span>
              Fuente <span className="font-semibold text-fg">Bitstamp</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <StatusDot online={online} pulse={online} />
              {online ? "en vivo" : "conectando"}
            </span>
          </div>
        }
      >
        Bitstamp BTC/USD
      </CardTitle>

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

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="grid flex-1 grid-cols-3 gap-2">
          <TrendPill label="1hr" value={trend1h} />
          <TrendPill label="24hs" value={trend24h} />
          <TrendPill label="Semanal" value={trend7d} />
        </div>
        <div className="shrink-0 sm:w-[180px]">
          <FearGreedMeter
            value={data?.fearGreed?.value}
            label={
              data?.fearGreed?.classificationEs ??
              data?.fearGreed?.classification
            }
            source={data?.fearGreed?.source}
          />
        </div>
      </div>

      {isError && (
        <div className="mt-3 text-xs text-down">
          No se pudo cargar tendencia o Fear & Greed.
        </div>
      )}
    </Card>
  );
}
