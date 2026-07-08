"use client";

import { useBtcArs } from "@/hooks/useBtcArs";
import { satToArs, SATS_PER_BTC } from "@/lib/calc/satArs";
import { fmtArs, fmtSatArs, fmtPct } from "@/lib/format";
import { cn } from "@/lib/cn";

export function SatParityHero() {
  const { value: btcArs, bestAsk, isLoading } = useBtcArs();

  const satArs = btcArs !== undefined ? satToArs(btcArs) : undefined;
  const ratio = satArs ?? 0; // 1.0 == parity (1 SAT = 1 ARS)
  const reached = ratio >= 1;
  const barPct = Math.max(0, Math.min(100, ratio * 100));
  const remainingPct =
    btcArs !== undefined ? (SATS_PER_BTC / btcArs - 1) * 100 : undefined;

  return (
    <section
      id="paridad"
      className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary-soft/15 via-surface to-bitcoin/10 p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <span className="grid h-5 w-5 place-items-center rounded bg-bitcoin/15 text-bitcoin">
              ₿
            </span>
            1 satoshi en pesos
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm text-muted">1 SAT =</span>
            <span
              className={cn(
                "font-mono text-5xl font-extrabold tabular-nums tracking-tight sm:text-6xl",
                reached ? "text-up" : "text-bitcoin",
              )}
            >
              {isLoading && satArs === undefined ? "—" : fmtSatArs(satArs)}
            </span>
            <span className="text-lg font-semibold text-muted">ARS</span>
          </div>
          <div className="mt-1 text-sm text-muted">
            1 BTC ={" "}
            <span className="font-medium text-fg">{fmtArs(btcArs)}</span>
            {bestAsk !== undefined && (
              <span className="ml-2 text-xs">
                · mejor compra {fmtArs(bestAsk)}
              </span>
            )}
          </div>
        </div>

        <div className="min-w-[220px] flex-1">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted">Camino a 1 SAT = 1 ARS</span>
            <span
              className={cn(
                "font-mono font-semibold tabular-nums",
                reached ? "text-up" : "text-fg",
              )}
            >
              {fmtPct(barPct)}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                reached
                  ? "bg-up"
                  : "bg-gradient-to-r from-primary to-bitcoin",
              )}
              style={{ width: `${barPct}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-muted">
            {reached ? (
              <span className="font-medium text-up">
                🎉 ¡Paridad alcanzada! 1 satoshi vale 1 peso o más.
              </span>
            ) : remainingPct !== undefined ? (
              <>
                El BTC debe llegar a{" "}
                <span className="font-medium text-fg">
                  {fmtArs(SATS_PER_BTC)}
                </span>{" "}
                — falta{" "}
                <span className="font-medium text-bitcoin">
                  {fmtPct(remainingPct)}
                </span>
                .
              </>
            ) : (
              "—"
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
