"use client";

import { ProviderMark } from "./ProviderMark";
import { fmtDestination, type SwapQuote } from "@/lib/data/swapProviders";

export function PayoutStep({
  quote,
  value,
  onChange,
  error,
}: {
  quote: SwapQuote;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const { provider, currency } = quote;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5 rounded-xl border border-border/70 p-3">
        <ProviderMark providerKey={provider.key} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{provider.name}</p>
          <p className="truncate text-[11px] text-muted">{currency.network}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-sm font-semibold tabular-nums">
            {fmtDestination(quote.receive, currency)}
          </div>
          <div className="text-[11px] text-muted">{provider.etaLabel}</div>
        </div>
      </div>

      <div>
        <label
          htmlFor="swap-payout"
          className="mb-1.5 block text-xs font-medium text-muted"
        >
          {provider.payoutLabel}
        </label>
        <input
          id="swap-payout"
          value={value}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          placeholder={provider.payoutPlaceholder}
          className="glass-input w-full rounded-xl border px-3 py-2.5 font-mono text-sm outline-none focus:border-bitcoin/50 placeholder:text-muted/60"
        />
        <p className="mt-1.5 text-[11px] text-muted">{provider.payoutHint}</p>
        {error && <p className="mt-1 text-xs text-down">{error}</p>}
      </div>

      {currency.kind === "bank" && (
        <div>
          <label
            htmlFor="swap-holder"
            className="mb-1.5 block text-xs font-medium text-muted"
          >
            Titular (opcional)
          </label>
          <input
            id="swap-holder"
            autoComplete="off"
            placeholder="Nombre y apellido"
            className="glass-input w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-bitcoin/50 placeholder:text-muted/60"
          />
        </div>
      )}

      <p className="text-[11px] text-muted">
        Demo de interfaz: todavía no se envía nada al proveedor.
      </p>
    </div>
  );
}
