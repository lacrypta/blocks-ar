"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { AmountStep } from "./AmountStep";
import { RouteList } from "./RouteList";
import { PayoutStep } from "./PayoutStep";
import { InvoiceStep } from "./InvoiceStep";
import { useSwapRoutes } from "@/hooks/useSwapRoutes";
import {
  currencyByCode,
  fmtDestination,
  mockInvoice,
  type SwapQuote,
} from "@/lib/data/swapProviders";
import { fmtNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

type Step = 0 | 1 | 2 | 3;

const STEPS = ["Monto", "Ruta", "Destino", "Pago"] as const;

function Steps({ step }: { step: Step }) {
  return (
    <ol className="flex items-center gap-1.5">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors",
              i === step
                ? "bg-bitcoin/15 text-bitcoin"
                : i < step
                  ? "text-up"
                  : "text-muted",
            )}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <span className="text-[10px] text-muted">›</span>
          )}
        </li>
      ))}
    </ol>
  );
}

function Summary({ quote, sats }: { quote?: SwapQuote; sats: number }) {
  return (
    <dl className="flex flex-col gap-1.5 text-[11px]">
      <div className="flex justify-between gap-2">
        <dt className="text-muted">Envías</dt>
        <dd className="font-mono tabular-nums">{fmtNumber(sats)} sats</dd>
      </div>
      <div className="flex justify-between gap-2">
        <dt className="text-muted">Costo total</dt>
        <dd className="font-mono tabular-nums">
          {quote?.ok ? `${fmtNumber(quote.feeSats)} sats` : "—"}
        </dd>
      </div>
      <div className="flex justify-between gap-2">
        <dt className="text-muted">Cotización</dt>
        <dd className="font-mono tabular-nums">
          {quote?.rate !== undefined
            ? `1 BTC = ${fmtDestination(quote.rate, quote.currency)}`
            : "—"}
        </dd>
      </div>
      <div className="flex justify-between gap-2 border-t border-border/60 pt-1.5">
        <dt className="font-medium">Recibís</dt>
        <dd className="font-mono font-semibold tabular-nums">
          {quote?.ok ? fmtDestination(quote.receive, quote.currency) : "—"}
        </dd>
      </div>
    </dl>
  );
}

export function SwapBlock() {
  const [step, setStep] = useState<Step>(0);
  const [sats, setSats] = useState(100_000);
  const [code, setCode] = useState("ARS");
  const [override, setOverride] = useState<string | undefined>();
  const [payout, setPayout] = useState("");
  const [invoice, setInvoice] = useState("");
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const currency = currencyByCode(code);
  const { routes, best } = useSwapRoutes(code, sats);

  const selected =
    routes.find((r) => r.provider.key === override && r.ok) ?? best;

  const changeCode = (next: string) => {
    setCode(next);
    setOverride(undefined);
    setError(undefined);
  };

  const next = () => {
    setError(undefined);
    if (step === 0) {
      if (sats <= 0) return setError("Ingresá un monto en sats.");
      if (!selected)
        return setError(
          "Ningún proveedor cotiza este monto. Probá con otro importe.",
        );
      return setStep(1);
    }
    if (step === 1) {
      if (!selected) return setError("Elegí una ruta disponible.");
      return setStep(2);
    }
    if (step === 2) {
      if (payout.trim().length < 4)
        return setError(`Completá ${selected?.provider.payoutLabel}.`);
      setInvoice(mockInvoice(sats));
      setPaid(false);
      return setStep(3);
    }
    // step 3 → restart
    setPaid(false);
    setPayout("");
    setInvoice("");
    setStep(0);
  };

  const back = () => {
    setError(undefined);
    setStep((s) => (s > 0 ? ((s - 1) as Step) : s));
  };

  const nextLabel =
    step === 0
      ? "Elegir ruta"
      : step === 1
        ? "Continuar"
        : step === 2
          ? "Generar factura"
          : paid
            ? "Nueva conversión"
            : "Empezar de nuevo";

  return (
    <Card>
      <CardTitle id="convertir" right={<Steps step={step} />}>
        Convertir sats
      </CardTitle>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {step === 0 && (
            <AmountStep
              sats={sats}
              onSats={(v) => {
                setSats(v);
                setError(undefined);
              }}
              code={code}
              onCode={changeCode}
              best={selected}
              currency={currency}
              error={error}
            />
          )}

          {step === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted">
                Ruta automática para {currency.code} — podés elegir otra.
              </p>
              <RouteList
                routes={routes}
                selected={selected?.provider.key}
                onSelect={(key) => setOverride(key)}
              />
              {error && <p className="text-xs text-down">{error}</p>}
            </div>
          )}

          {step === 2 && selected && (
            <PayoutStep
              quote={selected}
              value={payout}
              onChange={(v) => {
                setPayout(v);
                setError(undefined);
              }}
              error={error}
            />
          )}

          {step === 3 && selected && (
            <InvoiceStep
              quote={selected}
              invoice={invoice}
              payout={payout}
              paid={paid}
              onPaid={() => setPaid(true)}
            />
          )}
        </div>

        <aside className="flex flex-col gap-3 lg:col-span-2">
          <div className="glass-card-soft rounded-xl border p-3">
            <h3 className="mb-2 text-xs font-semibold text-muted">Resumen</h3>
            <Summary quote={selected} sats={sats} />
          </div>

          <div className="glass-card-soft rounded-xl border p-3">
            <h3 className="mb-2 text-xs font-semibold text-muted">
              Comparación de rutas
            </h3>
            <RouteList
              routes={routes}
              selected={selected?.provider.key}
              onSelect={step < 3 ? (key) => setOverride(key) : undefined}
              compact
            />
          </div>
        </aside>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors enabled:hover:text-fg disabled:opacity-40"
        >
          Atrás
        </button>
        <div className="flex items-center gap-2">
          {selected && (
            <a
              href={selected.provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-muted underline-offset-2 hover:text-fg hover:underline"
            >
              Sobre {selected.provider.name}
            </a>
          )}
          <button
            type="button"
            onClick={next}
            className="rounded-lg bg-bitcoin px-3.5 py-1.5 text-xs font-semibold text-white"
          >
            {nextLabel}
          </button>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-muted">
        Cotizaciones de referencia: BTC/ARS mediana de brokers y BTC/USD de los
        feeds de exchanges. Comisiones y límites son estimados de la interfaz —
        Wapu y Bull Bitcoin para ARS, Boltz para el resto.
      </p>
    </Card>
  );
}
