"use client";

import { useDollars } from "@/hooks/useDollars";
import { useBtcArs } from "@/hooks/useBtcArs";
import { useExchangeStats } from "@/hooks/useExchangeStats";
import { Card, CardTitle } from "@/components/ui/Card";
import { fmtArs, fmtPct } from "@/lib/format";
import { cn } from "@/lib/cn";

function DollarCard({
  label,
  value,
  variation,
  hint,
  accent,
}: {
  label: string;
  value?: number;
  variation?: number;
  hint?: string;
  accent?: boolean;
}) {
  const up = (variation ?? 0) >= 0;
  return (
    <div
      className={cn(
        "glass-card-soft rounded-xl border p-3",
        accent
          ? "border-bitcoin/35"
          : "",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        {variation !== undefined && (
          <span className={cn("text-[11px]", up ? "text-up" : "text-down")}>
            {fmtPct(variation)}
          </span>
        )}
      </div>
      <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
        {fmtArs(value, true)}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-muted">{hint}</div>}
    </div>
  );
}

export function DollarBlock() {
  const { data } = useDollars();
  const { value: btcArs } = useBtcArs();
  const { reference: btcUsd } = useExchangeStats();

  // Dólar "Bitcoin CM" — implicit USD via BTC.
  const bitcoinCm =
    btcArs !== undefined && btcUsd && btcUsd > 0 ? btcArs / btcUsd : undefined;
  const ccl = data?.ccl?.value;
  const brecha =
    bitcoinCm !== undefined && ccl && ccl > 0
      ? (bitcoinCm / ccl - 1) * 100
      : undefined;

  return (
    <Card>
      <CardTitle id="dolares">Dólares</CardTitle>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <DollarCard
          label="Promedio"
          value={data?.promedio?.value}
          variation={data?.promedio?.variation}
        />
        <DollarCard
          label="Blue"
          value={data?.blue?.value}
          variation={data?.blue?.variation}
        />
        <DollarCard
          label="CCL"
          value={data?.ccl?.value}
          variation={data?.ccl?.variation}
        />
        <DollarCard
          label="MEP"
          value={data?.mep?.value}
          variation={data?.mep?.variation}
        />
        <DollarCard
          label="Cripto (USDT)"
          value={data?.cripto?.value}
          variation={data?.cripto?.variation}
        />
        <DollarCard
          label="Bitcoin CM"
          value={bitcoinCm}
          hint={
            brecha !== undefined ? `Brecha vs CCL ${fmtPct(brecha)}` : undefined
          }
          accent
        />
      </div>
    </Card>
  );
}
