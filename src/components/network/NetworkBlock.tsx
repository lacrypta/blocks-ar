"use client";

import { useFees, useNetwork } from "@/hooks/useNetwork";
import { useBtcArs } from "@/hooks/useBtcArs";
import { Card, CardTitle } from "@/components/ui/Card";
import { satsToArs } from "@/lib/calc/satArs";
import { fmtArs, fmtNumber } from "@/lib/format";

const STANDARD_TRANSACTION_VBYTES = 140;

function FeeTier({
  label,
  value,
  arsPerTransaction,
  tone,
}: {
  label: string;
  value?: number;
  arsPerTransaction?: number;
  tone: string;
}) {
  return (
    <div className="glass-card-soft rounded-xl border p-3 text-center">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="mt-1 font-mono text-xl font-semibold tabular-nums">
        {fmtNumber(value, 1)}
      </div>
      <div className={`text-[11px] ${tone}`}>sat/vB</div>
      <div className="mt-1 text-[11px] text-muted">
        {arsPerTransaction !== undefined
          ? `≈ ${fmtArs(arsPerTransaction)} / tx`
          : "— / tx"}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card-soft rounded-xl border p-3">
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
  const { value: btcArs } = useBtcArs();
  const arsPerTransaction = (feeRate?: number) =>
    feeRate !== undefined && btcArs !== undefined
      ? satsToArs(feeRate * STANDARD_TRANSACTION_VBYTES, btcArs)
      : undefined;

  return (
    <Card>
      <CardTitle id="red">Red Bitcoin</CardTitle>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <FeeTier
          label="Alta"
          value={fees?.fastestFee}
          arsPerTransaction={arsPerTransaction(fees?.fastestFee)}
          tone="text-bitcoin"
        />
        <FeeTier
          label="Media"
          value={fees?.halfHourFee}
          arsPerTransaction={arsPerTransaction(fees?.halfHourFee)}
          tone="text-primary"
        />
        <FeeTier
          label="Baja"
          value={fees?.hourFee}
          arsPerTransaction={arsPerTransaction(fees?.hourFee)}
          tone="text-muted"
        />
        <FeeTier
          label="Económica"
          value={fees?.economyFee}
          arsPerTransaction={arsPerTransaction(fees?.economyFee)}
          tone="text-muted"
        />
        <FeeTier
          label="Sin prioridad"
          value={fees?.minimumFee}
          arsPerTransaction={arsPerTransaction(fees?.minimumFee)}
          tone="text-muted"
        />
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Estimado por transacción SegWit estándar de {STANDARD_TRANSACTION_VBYTES} vB.
      </p>

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
