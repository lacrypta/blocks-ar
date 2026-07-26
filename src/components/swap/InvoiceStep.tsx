"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { SatSymbol } from "@/components/icons/SatSymbol";
import { fmtDestination, type SwapQuote } from "@/lib/data/swapProviders";
import { fmtNumber } from "@/lib/format";
import { StatusDot } from "@/components/ui/StatusDot";

const EXPIRY_SECONDS = 15 * 60;

function mmss(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function InvoiceStep({
  quote,
  invoice,
  payout,
  paid,
  onPaid,
}: {
  quote: SwapQuote;
  invoice: string;
  payout: string;
  paid: boolean;
  onPaid: () => void;
}) {
  const [left, setLeft] = useState(EXPIRY_SECONDS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (paid) return;
    const id = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [paid]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  if (paid) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-up/15 text-lg font-bold text-up">
          ✓
        </span>
        <div>
          <p className="text-sm font-semibold">Pago detectado</p>
          <p className="text-xs text-muted">
            {quote.provider.name} está liquidando{" "}
            {fmtDestination(quote.receive, quote.currency)}.
          </p>
        </div>
        <div className="glass-card-soft w-full rounded-xl border p-3 text-left">
          <dl className="flex flex-col gap-1 text-[11px] text-muted">
            <div className="flex justify-between gap-2">
              <dt>Destino</dt>
              <dd className="truncate font-mono text-fg">{payout || "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Acreditación</dt>
              <dd className="text-fg">{quote.provider.etaLabel}</dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <StatusDot online />
          Esperando pago Lightning
        </span>
        <span className="font-mono text-xs tabular-nums text-muted">
          expira en {mmss(left)}
        </span>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <div className="rounded-xl border border-border/70 bg-white p-2.5">
          <QRCodeSVG
            value={invoice.toUpperCase()}
            size={148}
            level="M"
            bgColor="#ffffff"
            fgColor="#0b1220"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div>
            <span className="text-[11px] text-muted">Monto</span>
            <div className="flex items-center gap-1.5 font-mono text-xl font-semibold tabular-nums">
              <SatSymbol className="h-4 text-bitcoin" title="sats" />
              {fmtNumber(quote.sats)}
            </div>
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-muted">Factura</span>
            <p className="break-all font-mono text-[11px] leading-relaxed text-muted">
              {invoice.slice(0, 64)}…
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="glass-pill rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:text-bitcoin"
            >
              {copied ? "Copiado" : "Copiar factura"}
            </button>
            <button
              type="button"
              onClick={onPaid}
              className="rounded-lg bg-bitcoin px-3 py-1.5 text-xs font-semibold text-white"
            >
              Simular pago
            </button>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted">
        Factura de ejemplo — el QR no es pagable. La integración real se conecta
        en el próximo paso.
      </p>
    </div>
  );
}
