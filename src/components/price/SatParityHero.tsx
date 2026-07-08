"use client";

import { useState } from "react";
import { useBtcArs } from "@/hooks/useBtcArs";
import { satToArs, SATS_PER_BTC } from "@/lib/calc/satArs";
import { fmtArs, fmtSatArs, fmtPct } from "@/lib/format";
import { cn } from "@/lib/cn";

const DEV_SIMULATED_SAT_ARS = 1.56;
const DEV_SIMULATED_BTC_ARS = DEV_SIMULATED_SAT_ARS * SATS_PER_BTC;
const SAT_PARITY_CHART_URL = "https://1satoshi1peso.ar/ARS";
const SHOW_DEV_SIMULATOR = process.env.NODE_ENV !== "production";

export function SatParityHero() {
  const { value: btcArs, bestAsk, isLoading } = useBtcArs();
  const [useSimulatedParity, setUseSimulatedParity] = useState(false);

  const displayBtcArs = useSimulatedParity ? DEV_SIMULATED_BTC_ARS : btcArs;
  const displayBestAsk = useSimulatedParity ? undefined : bestAsk;
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
      className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary-soft/15 via-surface to-bitcoin/10 p-6 shadow-sm sm:p-8"
    >
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <a
          href={SAT_PARITY_CHART_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-fg"
        >
          <ChartIcon className="h-3.5 w-3.5" />
          Ver grafico
        </a>

        {SHOW_DEV_SIMULATOR && (
          <button
            type="button"
            onClick={() => setUseSimulatedParity((value) => !value)}
            aria-pressed={useSimulatedParity}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              useSimulatedParity
                ? "border-bitcoin/40 bg-bitcoin/10 text-bitcoin"
                : "border-border bg-surface/80 text-muted hover:text-fg",
            )}
          >
            {useSimulatedParity ? "Volver a valor real" : "Simular 1,56 ARS"}
          </button>
        )}
      </div>

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
                hasReachedFirstPeso ? "text-up" : "text-bitcoin",
              )}
            >
              {isLoading && satArs === undefined ? "—" : fmtSatArs(satArs)}
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

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19V5" />
      <path d="M4 19H20" />
      <path d="M7 15L11 11L14 13L19 8" />
      <path d="M16 8H19V11" />
    </svg>
  );
}
