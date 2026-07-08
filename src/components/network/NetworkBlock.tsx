"use client";

import { useFees, useNetwork } from "@/hooks/useNetwork";
import { Card, CardTitle } from "@/components/ui/Card";
import { fmtNumber } from "@/lib/format";

function FeeTier({
  label,
  value,
  tone,
}: {
  label: string;
  value?: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-3 text-center">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="mt-1 font-mono text-xl font-semibold tabular-nums">
        {value ?? "—"}
      </div>
      <div className={`text-[11px] ${tone}`}>sat/vB</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-3">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

export function NetworkBlock() {
  const { data: fees } = useFees();
  const { emissionPct, volumeBtc, height } = useNetwork();

  return (
    <Card>
      <CardTitle id="red">Red Bitcoin</CardTitle>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <FeeTier label="Alta" value={fees?.fastestFee} tone="text-bitcoin" />
        <FeeTier label="Media" value={fees?.halfHourFee} tone="text-primary" />
        <FeeTier label="Baja" value={fees?.hourFee} tone="text-muted" />
        <FeeTier label="Mínima" value={fees?.economyFee} tone="text-muted" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Metric
          label="Emisión anual"
          value={emissionPct !== undefined ? `${fmtNumber(emissionPct, 2)}%` : "—"}
        />
        <Metric
          label="Volumen 24h (BTC)"
          value={volumeBtc !== undefined ? fmtNumber(volumeBtc) : "—"}
        />
        <Metric
          label="Altura de bloque"
          value={height !== undefined ? fmtNumber(height) : "—"}
        />
      </div>
    </Card>
  );
}
