"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AR_EXCHANGES,
  AR_EXCHANGES_GITHUB_EDIT_URL,
  type ArExchange,
  BITCOINER_FEATURE_DETAILS,
  BITCOINER_FEATURE_KEYS,
  type BitcoinerFeatureKey,
  bitcoinerLevel,
  exchangeSupportRank,
} from "@/lib/data/arExchanges";
import { resolvePriceSource } from "@/lib/data/priceSource";
import { useBrokers } from "@/hooks/useBrokers";
import type { BrokerQuote } from "@/lib/api/criptoya";
import {
  BitcoinerBadge,
  BitcoinerFeatureIcon,
  ExchangeDetailDialog,
  type ExchangeDetailData,
} from "@/components/exchanges/ExchangeDetailDialog";
import { BrokerLogo } from "@/components/brokers/BrokerLogo";
import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

function YesNo({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
        ok ? "bg-up/15 text-up" : "bg-offline/15 text-offline",
      )}
      aria-label={ok ? "Sí" : "No"}
    >
      {ok ? "✓" : "✗"}
    </span>
  );
}

function InfoIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10V16" />
      <path d="M12 7H12.01" />
    </svg>
  );
}

function FeatureRow({
  featureKey,
}: {
  featureKey: BitcoinerFeatureKey;
}) {
  const feature = BITCOINER_FEATURE_DETAILS[featureKey];

  return (
    <li className="glass-card-soft rounded-lg border p-3">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft/20 text-primary">
          <BitcoinerFeatureIcon
            featureKey={featureKey}
            className="h-[18px] w-[18px]"
          />
        </span>
        <div>
          <p className="text-sm font-semibold text-fg">{feature.label}</p>
          <p className="mt-1 text-[11px] text-muted">{feature.description}</p>
        </div>
      </div>
    </li>
  );
}

function BitcoinerInfoModal({
  onClose,
  open,
}: {
  onClose: () => void;
  open: boolean;
}) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bitcoiner-level-title"
        className="glass-popover w-full max-w-2xl rounded-2xl border p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              id="bitcoiner-level-title"
              className="text-base font-semibold text-fg"
            >
              Nivel Bitcoiner
            </h3>
            <p className="mt-1 text-sm text-muted">
              Cada exchange suma 1 punto por cada criterio cumplido.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-fg"
          >
            Cerrar
          </button>
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BITCOINER_FEATURE_KEYS.map((featureKey) => (
            <FeatureRow key={featureKey} featureKey={featureKey} />
          ))}
        </ul>

        <p className="mt-4 text-[11px] text-muted">
          El badge de cada exchange muestra el score total y, al pasar el mouse,
          detalla qué criterios suma y cuáles le faltan.
        </p>
      </div>
    </div>
  );
}

export function ArExchangeSupportTable() {
  const [onlyLnAddress, setOnlyLnAddress] = useState(false);
  const [query, setQuery] = useState("");
  const [isBitcoinerModalOpen, setIsBitcoinerModalOpen] = useState(false);
  const [selected, setSelected] = useState<ArExchange | null>(null);
  const { data: brokers } = useBrokers();

  const quotesByKey = useMemo(() => {
    const map = new Map<string, BrokerQuote>();
    for (const q of brokers ?? []) map.set(q.key, q);
    return map;
  }, [brokers]);

  const selectedDetail: ExchangeDetailData | null = useMemo(() => {
    if (!selected) return null;
    const source = resolvePriceSource(selected);
    return {
      name: selected.name,
      logoKey: selected.criptoyaKey ?? selected.key,
      url: selected.url,
      custodial: selected.custodial,
      source,
      quote: quotesByKey.get(source.quoteKey ?? ""),
      exchange: selected,
    };
  }, [selected, quotesByKey]);

  const rows = useMemo(() => {
    return AR_EXCHANGES.filter((e) => {
      if (onlyLnAddress && !e.lightningAddressIn) return false;
      if (query && !e.name.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const levelDelta = bitcoinerLevel(b) - bitcoinerLevel(a);
      if (levelDelta !== 0) return levelDelta;

      const rankDelta = exchangeSupportRank(b) - exchangeSupportRank(a);
      if (rankDelta !== 0) return rankDelta;

      const lightningAddressDelta =
        Number(b.lightningAddressIn) - Number(a.lightningAddressIn);
      if (lightningAddressDelta !== 0) return lightningAddressDelta;

      const lightningDelta = Number(b.lightning) - Number(a.lightning);
      if (lightningDelta !== 0) return lightningDelta;

      const btcDelta = Number(b.btcOnchain) - Number(a.btcOnchain);
      if (btcDelta !== 0) return btcDelta;

      return a.name.localeCompare(b.name, "es");
    });
  }, [onlyLnAddress, query]);

  return (
    <Card>
      <CardTitle
        id="exchanges"
        right={
          <label className="flex items-center gap-1.5 text-[11px] text-muted">
            <input
              type="checkbox"
              checked={onlyLnAddress}
              onChange={(e) => setOnlyLnAddress(e.target.checked)}
              className="accent-bitcoin"
            />
            Solo Lightning Address
          </label>
        }
      >
        Top Exchanges (Bitcoiner Index)
      </CardTitle>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar exchange…"
        className="glass-input mb-3 w-full rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-primary"
      />

      <div className="mb-2 flex justify-start">
        <button
          type="button"
          onClick={() => setIsBitcoinerModalOpen(true)}
          className="glass-pill inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-fg"
        >
          <InfoIcon className="h-3.5 w-3.5" />
          Nivel Bitcoiner
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="py-2 pr-2 font-medium">Exchange</th>
              <th className="py-2 px-2 text-center font-medium">Nivel</th>
              <th className="py-2 px-2 text-center font-medium">BTC on-chain</th>
              <th className="py-2 px-2 text-center font-medium">Lightning</th>
              <th className="py-2 px-2 text-center font-medium">LN Address</th>
              <th className="py-2 pl-2 text-center font-medium">Custodia</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr
                key={e.key}
                className="border-t border-border hover:bg-surface-2/50"
              >
                <td className="py-2.5 pr-2 font-medium">
                  <button
                    type="button"
                    onClick={() => setSelected(e)}
                    aria-haspopup="dialog"
                    aria-label={`Ver detalle y fuente de precio de ${e.name}`}
                    className="inline-flex items-center gap-2 rounded text-left outline-none ring-offset-2 transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <BrokerLogo brokerKey={e.criptoyaKey ?? e.key} />
                    <span className="underline decoration-dotted decoration-muted/40 underline-offset-4">
                      {e.name}
                    </span>
                  </button>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <BitcoinerBadge exchange={e} />
                </td>
                <td className="py-2.5 px-2 text-center">
                  <YesNo ok={e.btcOnchain} />
                </td>
                <td className="py-2.5 px-2 text-center">
                  <YesNo ok={e.lightning} />
                </td>
                <td className="py-2.5 px-2 text-center">
                  <YesNo ok={e.lightningAddressIn} />
                </td>
                <td className="py-2.5 pl-2 text-center text-[11px] text-muted">
                  {e.custodial ? "Custodial" : "No custodial"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-sm text-muted">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-muted">
        ⚠️ Datos informativos, a verificar con cada plataforma — el soporte de
        Lightning cambia seguido.
      </p>
      <a
        href={AR_EXCHANGES_GITHUB_EDIT_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex text-[11px] font-medium text-primary hover:underline"
      >
        Editar JSON en GitHub
      </a>

      <BitcoinerInfoModal
        open={isBitcoinerModalOpen}
        onClose={() => setIsBitcoinerModalOpen(false)}
      />

      <ExchangeDetailDialog
        data={selectedDetail}
        onClose={() => setSelected(null)}
      />
    </Card>
  );
}
