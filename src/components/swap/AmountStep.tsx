"use client";

import { SatSymbol } from "@/components/icons/SatSymbol";
import {
  SWAP_CURRENCIES,
  fmtDestination,
  type SwapCurrency,
  type SwapQuote,
} from "@/lib/data/swapProviders";
import { fmtNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

const PRESETS = [21_000, 100_000, 500_000, 2_100_000];

const GROUP_LABEL: Record<SwapCurrency["group"], string> = {
  fiat: "Pesos",
  stable: "Stablecoins",
  bitcoin: "Bitcoin",
};

export function AmountStep({
  sats,
  onSats,
  code,
  onCode,
  best,
  currency,
  error,
}: {
  sats: number;
  onSats: (sats: number) => void;
  code: string;
  onCode: (code: string) => void;
  best?: SwapQuote;
  currency: SwapCurrency;
  error?: string;
}) {
  const groups: SwapCurrency["group"][] = ["fiat", "stable", "bitcoin"];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="swap-amount"
          className="mb-1.5 block text-xs font-medium text-muted"
        >
          Enviás por Lightning
        </label>
        <div className="glass-input flex items-center gap-2 rounded-xl border px-3 py-2.5 focus-within:border-bitcoin/50">
          <SatSymbol className="h-5 text-bitcoin" title="sats" />
          <input
            id="swap-amount"
            inputMode="numeric"
            autoComplete="off"
            value={sats === 0 ? "" : fmtNumber(sats)}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
              onSats(digits ? Number(digits) : 0);
            }}
            placeholder="0"
            className="min-w-0 flex-1 bg-transparent font-mono text-2xl font-semibold tabular-nums outline-none placeholder:text-muted/50"
          />
          <span className="shrink-0 text-xs font-medium text-muted">sats</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onSats(p)}
              className={cn(
                "glass-pill rounded-lg border px-2.5 py-1 text-[11px] font-semibold tabular-nums transition-colors",
                sats === p ? "text-bitcoin" : "text-muted hover:text-fg",
              )}
            >
              {fmtNumber(p)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-medium text-muted">
          Recibís en
        </span>
        <div className="flex flex-col gap-2">
          {groups.map((group) => (
            <div key={group} className="flex flex-wrap items-center gap-1.5">
              <span className="w-20 shrink-0 text-[11px] text-muted">
                {GROUP_LABEL[group]}
              </span>
              {SWAP_CURRENCIES.filter((c) => c.group === group).map((c) => {
                const active = c.code === code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onCode(c.code)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "border-bitcoin/50 bg-bitcoin/10 text-bitcoin"
                        : "border-border/70 text-muted hover:text-fg",
                    )}
                  >
                    {c.code}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card-soft rounded-xl border p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-muted">
            Recibís aprox. en {currency.code}
          </span>
          {best && (
            <span className="text-[11px] text-muted">
              vía {best.provider.name}
            </span>
          )}
        </div>
        <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">
          {best?.ok ? fmtDestination(best.receive, currency) : "—"}
        </div>
        <p className="mt-1 text-[11px] text-muted">{currency.network}</p>
      </div>

      {error && <p className="text-xs text-down">{error}</p>}
    </div>
  );
}
