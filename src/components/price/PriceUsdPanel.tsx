"use client";

import { useExchangeStats } from "@/hooks/useExchangeStats";
import { Card } from "@/components/ui/Card";
import { fmtUsd } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted">{label}</span>
      <span className="font-mono text-lg font-semibold tabular-nums">
        {value}
      </span>
    </div>
  );
}

export function PriceUsdPanel() {
  const { median, average, reference } = useExchangeStats();
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted">BTC / USD</h2>
        <span className="text-[11px] text-muted">en vivo · exchanges</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Mediana" value={fmtUsd(median, true)} />
        <Stat label="Promedio" value={fmtUsd(average, true)} />
        <Stat label="Bitstamp (ref.)" value={fmtUsd(reference, true)} />
      </div>
    </Card>
  );
}
