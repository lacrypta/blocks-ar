"use client";

import { useFees } from "@/hooks/useNetwork";
import { fmtNumber } from "@/lib/format";

const FEE_LABELS = [
  { key: "fastestFee", label: "Alta" },
  { key: "halfHourFee", label: "Media" },
  { key: "hourFee", label: "Baja" },
  { key: "economyFee", label: "Económica" },
  { key: "minimumFee", label: "Sin prioridad" },
] as const;

export function MempoolFeeBadge() {
  const { data: fees } = useFees();
  const mediumFee = fees?.halfHourFee;
  const formattedMediumFee = fmtNumber(mediumFee, 1);

  return (
    <div className="group relative flex-none">
      <span
        tabIndex={0}
        aria-label={
          mediumFee !== undefined
            ? `Mempool prioridad media ${formattedMediumFee} satoshis por vByte`
            : "Mempool sin datos"
        }
        className="glass-pill inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium text-muted outline-none ring-offset-2 transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-primary"
      >
        <MempoolIcon className="h-4 w-4 text-primary" />
        <span className="font-semibold text-fg">
          {formattedMediumFee}
        </span>
        <span className="hidden sm:inline">sat/vB</span>
      </span>

      <div
        role="tooltip"
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-full z-[60] mt-2 w-max max-w-64 origin-top-right opacity-0 invisible -translate-y-1 scale-95 transition duration-150 ease-out group-hover:visible group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100"
      >
        <div className="glass-popover rounded-xl border p-3 text-left">
          <span className="block text-[11px] font-semibold text-fg">
            Mempool.space · prioridad media
          </span>
          <span className="mt-1 block text-[11px] text-muted">
            {mediumFee !== undefined ? `${formattedMediumFee} sat/vB` : "—"}
          </span>

          <span className="mt-3 grid gap-1.5">
            {FEE_LABELS.map((item) => (
              <span
                key={item.key}
                className="flex items-center justify-between gap-3 text-[11px]"
              >
                <span className="text-muted">{item.label}</span>
                <span className="font-mono font-semibold tabular-nums text-fg">
                  {fees ? fmtNumber(fees[item.key], 1) : "—"} sat/vB
                </span>
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

function MempoolIcon({ className }: { className?: string }) {
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
      <path d="M4 17L9 12L12 15L20 7" />
      <path d="M20 7H15" />
      <path d="M20 7V12" />
    </svg>
  );
}
