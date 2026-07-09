"use client";

import { useBtcArs } from "@/hooks/useBtcArs";
import { satToArs, SATS_PER_BTC } from "@/lib/calc/satArs";
import { SatSymbol } from "@/components/icons/SatSymbol";
import { fmtArs, fmtSatArs, fmtPct } from "@/lib/format";
import { cn } from "@/lib/cn";

function SatArsDisplay({ value }: { value?: number }) {
  const formatted = fmtSatArs(value);

  if (formatted === "—") {
    return <>{formatted}</>;
  }

  const [whole, fractional = ""] = formatted.split(",");
  if (fractional.length <= 2) {
    return <>{formatted}</>;
  }

  const mainFraction = fractional.slice(0, 2);
  const extraFraction = fractional.slice(2);

  return (
    <>
      <span>{`${whole},${mainFraction}`}</span>
      <span className="text-[0.65em]">{extraFraction}</span>
    </>
  );
}

export function SatParityHero() {
  const { value: btcArs, bestAsk, isLoading } = useBtcArs();
  const displayBtcArs = btcArs;
  const displayBestAsk = bestAsk;
  const satArs =
    displayBtcArs !== undefined ? satToArs(displayBtcArs) : undefined;
  const ratio = satArs ?? 0;
  const hasReachedFirstPeso = ratio >= 1;
  const targetPesos =
    satArs !== undefined ? Math.max(1, Math.floor(ratio) + 1) : 1;
  const targetLabel = `${targetPesos} ${targetPesos === 1 ? "peso" : "pesos"}`;
  const targetBtcArs = targetPesos * SATS_PER_BTC;
  const barPct = Math.max(0, Math.min(100, (ratio / targetPesos) * 100));
  const remainingPct =
    displayBtcArs !== undefined
      ? (targetBtcArs / displayBtcArs - 1) * 100
      : undefined;

  return (
    <section
      id="paridad"
      className="glass-card relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-white/10 to-bitcoin/12 p-6 sm:p-8"
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
            <span className="inline-flex items-center gap-1.5 text-muted">
              <span className="text-[2rem] font-medium leading-none">1</span>
              <SatSymbol
                title="sat"
                className="h-9 text-black dark:text-white"
              />
              <span className="text-sm">=</span>
            </span>
            <span
              className={cn(
                "font-mono text-5xl font-extrabold tabular-nums tracking-tight sm:text-6xl",
                hasReachedFirstPeso ? "text-up" : "text-bitcoin",
              )}
            >
              {isLoading && satArs === undefined ? "—" : <SatArsDisplay value={satArs} />}
            </span>
            <span className="text-lg font-semibold text-muted">ARS</span>
          </div>
          <div className="mt-1 text-sm text-muted">
            1 BTC ={" "}
            <span className="font-medium text-fg">{fmtArs(displayBtcArs)}</span>
            {displayBestAsk !== undefined && (
              <span className="ml-2 text-xs">
                · mejor compra {fmtArs(displayBestAsk)}
              </span>
            )}
          </div>
        </div>

        <div className="min-w-[220px] flex-1">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted">En camino a {targetLabel}</span>
            <span
              className={cn(
                "font-mono font-semibold tabular-nums",
                hasReachedFirstPeso ? "text-up" : "text-fg",
              )}
            >
              {fmtPct(barPct)}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                hasReachedFirstPeso
                  ? "bg-up"
                  : "bg-gradient-to-r from-primary to-bitcoin",
              )}
              style={{ width: `${barPct}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-muted">
            {remainingPct !== undefined ? (
              <>
                {hasReachedFirstPeso && (
                  <>
                    <span className="font-medium text-up">
                      🎉 Paridad alcanzada, vamos por {targetPesos}x.
                    </span>{" "}
                  </>
                )}
                Para llegar a {targetLabel}, el BTC debe tocar{" "}
                <span className="font-medium text-fg">
                  {fmtArs(targetBtcArs)}
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
