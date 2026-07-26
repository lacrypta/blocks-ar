"use client";

import { ProviderMark } from "./ProviderMark";
import { fmtDestination, type SwapQuote } from "@/lib/data/swapProviders";
import { fmtNumber, fmtPct } from "@/lib/format";
import { cn } from "@/lib/cn";

function unavailableReason(q: SwapQuote) {
  if (q.belowMin) return `Mínimo ${fmtNumber(q.provider.minSats)} sats`;
  if (q.aboveMax) return `Máximo ${fmtNumber(q.provider.maxSats)} sats`;
  return "Sin cotización";
}

export function RouteList({
  routes,
  selected,
  onSelect,
  compact,
}: {
  routes: SwapQuote[];
  selected?: string;
  onSelect?: (key: string) => void;
  compact?: boolean;
}) {
  if (routes.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        No hay rutas para esta moneda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {routes.map((q, i) => {
        const active = selected === q.provider.key;
        const best = i === 0 && q.ok;
        const interactive = Boolean(onSelect) && q.ok;

        return (
          <li key={q.provider.key}>
            <button
              type="button"
              disabled={!interactive}
              aria-pressed={active}
              onClick={() => onSelect?.(q.provider.key)}
              className={cn(
                "w-full rounded-xl border p-3 text-left transition-colors",
                active
                  ? "border-bitcoin/50 bg-bitcoin/5"
                  : "border-border/70 hover:border-border",
                !q.ok && "opacity-55",
                interactive && "cursor-pointer",
              )}
            >
              <div className="flex items-start gap-2.5">
                <ProviderMark providerKey={q.provider.key} size={compact ? "sm" : "md"} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">
                      {q.provider.name}
                    </span>
                    {best && (
                      <span className="shrink-0 rounded bg-up/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-up">
                        Mejor
                      </span>
                    )}
                  </div>
                  {!compact && (
                    <p className="truncate text-[11px] text-muted">
                      {q.provider.tagline}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-sm font-semibold tabular-nums">
                    {q.ok ? fmtDestination(q.receive, q.currency) : "—"}
                  </div>
                  <div className="text-[11px] text-muted tabular-nums">
                    {q.ok
                      ? `costo ${fmtPct(q.feePct)}`
                      : unavailableReason(q)}
                  </div>
                </div>
              </div>

              {!compact && (
                <dl className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/60 pt-2 text-[11px] text-muted">
                  <div className="flex gap-1">
                    <dt>Comisión</dt>
                    <dd className="tabular-nums text-fg">
                      {fmtPct(q.provider.feePct)}
                      {q.provider.fixedFeeSats > 0 &&
                        ` + ${fmtNumber(q.provider.fixedFeeSats)} sats`}
                    </dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>Spread</dt>
                    <dd className="tabular-nums text-fg">
                      {fmtPct(q.provider.spreadPct)}
                    </dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>Acredita</dt>
                    <dd className="text-fg">{q.provider.etaLabel}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>Custodia</dt>
                    <dd className="text-fg">
                      {q.provider.custody === "non-custodial"
                        ? "no custodial"
                        : "custodial"}
                    </dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>KYC</dt>
                    <dd className="text-fg">{q.provider.kyc}</dd>
                  </div>
                </dl>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
