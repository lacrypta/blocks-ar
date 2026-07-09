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

function BitcoinerBadge({ exchange }: { exchange: ArExchange }) {
  const score = bitcoinerLevel(exchange);
  const breakdown = BITCOINER_FEATURE_KEYS.map((key) => ({
    description: BITCOINER_FEATURE_DETAILS[key].description,
    enabled: exchange.bitcoiner[key],
    key,
    label: BITCOINER_FEATURE_DETAILS[key].label,
  }));
  const met = breakdown.filter((item) => item.enabled).map((item) => item.label);
  const missing = breakdown
    .filter((item) => !item.enabled)
    .map((item) => item.label);

  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        title={`Bitcoiner Level ${score}/10`}
        aria-label={`Bitcoiner Level ${score} de 10`}
        className={cn(
          "inline-flex min-w-12 items-center justify-center rounded-full px-2 py-1 text-[11px] font-semibold tabular-nums outline-none ring-offset-2 transition-shadow focus-visible:ring-2 focus-visible:ring-primary",
          score >= 7
            ? "bg-bitcoin/15 text-bitcoin"
            : score >= 4
              ? "bg-primary-soft/20 text-primary"
              : "bg-surface-2 text-muted",
        )}
      >
        {score}/10
      </span>

      <span className="glass-popover pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-72 -translate-x-1/2 rounded-xl border p-3 text-left group-hover:block group-focus-within:block">
        <span className="block text-[11px] font-semibold text-fg">
          Bitcoiner Level {score}/10
        </span>
        <span className="mt-1 block text-[11px] text-muted">
          Suma 1 punto por cada criterio cumplido.
        </span>

        <span className="mt-2 block text-[11px] text-up">Cumple</span>
        <span className="mt-1 flex flex-wrap gap-1">
          {met.length > 0 ? (
            breakdown
              .filter((item) => item.enabled)
              .map((item) => (
                <FeatureToken
                  key={item.key}
                  featureKey={item.key}
                  tone="positive"
                />
              ))
          ) : (
            <span className="text-[11px] text-muted">ninguno</span>
          )}
        </span>

        <span className="mt-2 block text-[11px] text-muted">Falta</span>
        <span className="mt-1 flex flex-wrap gap-1">
          {missing.length > 0 ? (
            breakdown
              .filter((item) => !item.enabled)
              .map((item) => (
                <FeatureToken
                  key={item.key}
                  featureKey={item.key}
                  tone="muted"
                />
              ))
          ) : (
            <span className="text-[11px] text-up">nada</span>
          )}
        </span>
      </span>
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

function BitcoinerFeatureIcon({
  featureKey,
  className,
}: {
  featureKey: BitcoinerFeatureKey;
  className?: string;
}) {
  const sharedProps = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (featureKey) {
    case "onchain":
      return (
        <svg {...sharedProps}>
          <path d="M9 8L6 11A3 3 0 0 0 10 15L13 12" />
          <path d="M15 16L18 13A3 3 0 0 0 14 9L11 12" />
        </svg>
      );
    case "lightning":
      return (
        <svg {...sharedProps}>
          <path d="M13 2L5 13H11L10 22L18 11H12L13 2Z" />
        </svg>
      );
    case "lightningAddressOut":
      return (
        <svg {...sharedProps}>
          <path d="M16 8L20 8" />
          <path d="M18 6L20 8L18 10" />
          <path d="M8.5 16C6.6 16 5 14.4 5 12.5C5 9.5 7.2 7 10.3 7C12.4 7 14 8 14.8 9.6C15.2 10.4 15.4 11.4 15.4 12.4V14.3C15.4 15.2 16.1 16 17 16C17.9 16 18.6 15.2 18.6 14.3V12.5C18.6 8.5 15.3 5.2 11.3 5.2C7.3 5.2 4 8.5 4 12.5C4 16.5 7.3 19.8 11.3 19.8C12.7 19.8 13.9 19.5 15 18.8" />
        </svg>
      );
    case "lightningAddressIn":
      return (
        <svg {...sharedProps}>
          <path d="M20 8L16 8" />
          <path d="M18 6L16 8L18 10" />
          <path d="M8.5 16C6.6 16 5 14.4 5 12.5C5 9.5 7.2 7 10.3 7C12.4 7 14 8 14.8 9.6C15.2 10.4 15.4 11.4 15.4 12.4V14.3C15.4 15.2 16.1 16 17 16C17.9 16 18.6 15.2 18.6 14.3V12.5C18.6 8.5 15.3 5.2 11.3 5.2C7.3 5.2 4 8.5 4 12.5C4 16.5 7.3 19.8 11.3 19.8C12.7 19.8 13.9 19.5 15 18.8" />
        </svg>
      );
    case "api":
      return (
        <svg {...sharedProps}>
          <path d="M8 8L4 12L8 16" />
          <path d="M16 8L20 12L16 16" />
          <path d="M13 5L11 19" />
        </svg>
      );
    case "selfCustody":
      return (
        <svg {...sharedProps}>
          <path d="M12 14A2 2 0 1 0 12 10A2 2 0 0 0 12 14Z" />
          <path d="M19 10H8A2 2 0 0 0 6 12V18H17A2 2 0 0 0 19 16V10Z" />
          <path d="M9 10V8A3 3 0 0 1 15 8V10" />
        </svg>
      );
    case "nonMandatoryKyc":
      return (
        <svg {...sharedProps}>
          <rect x="3" y="6" width="14" height="12" rx="2" />
          <path d="M7 10H13" />
          <path d="M7 14H11" />
          <path d="M20 7L22 9L17 14L14 14L14 11L19 6" />
        </svg>
      );
    case "openSourceContributions":
      return (
        <svg {...sharedProps}>
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="12" cy="18" r="2" />
          <path d="M8 7.5L10.5 10" />
          <path d="M16 7.5L13.5 10" />
          <path d="M12 16V11" />
        </svg>
      );
    case "bitcoinOnly":
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M10 8.5H12.7C14.1 8.5 15 9.2 15 10.4C15 11.5 14.1 12.2 12.7 12.2H10V8.5Z" />
          <path d="M10 12.2H13.2C14.8 12.2 15.8 13 15.8 14.3C15.8 15.7 14.8 16.5 13.2 16.5H10V12.2Z" />
          <path d="M11 7V17" />
          <path d="M13.5 7V17" />
        </svg>
      );
    case "noCryptoOnlyStablecoins":
      return (
        <svg {...sharedProps}>
          <ellipse cx="12" cy="8" rx="6" ry="3" />
          <path d="M6 8V13C6 14.7 8.7 16 12 16C15.3 16 18 14.7 18 13V8" />
          <path d="M8 19L19 8" />
        </svg>
      );
  }
}

function FeatureToken({
  featureKey,
  tone,
}: {
  featureKey: BitcoinerFeatureKey;
  tone: "muted" | "positive";
}) {
  const feature = BITCOINER_FEATURE_DETAILS[featureKey];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium",
        tone === "positive"
          ? "bg-up/10 text-up"
          : "bg-surface-2 text-muted",
      )}
    >
      <BitcoinerFeatureIcon featureKey={featureKey} className="h-3.5 w-3.5" />
      <span>{feature.label}</span>
    </span>
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
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 hover:text-primary"
                  >
                    <BrokerLogo brokerKey={e.criptoyaKey ?? e.key} />
                    <span>{e.name}</span>
                  </a>
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
    </Card>
  );
}
