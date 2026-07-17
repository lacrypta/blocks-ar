"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AR_EXCHANGES_GITHUB_EDIT_URL,
  type ArExchange,
  BITCOINER_FEATURE_DETAILS,
  BITCOINER_FEATURE_KEYS,
  type BitcoinerFeatureKey,
  bitcoinerLevel,
} from "@/lib/data/arExchanges";
import type { PriceSourceInfo, PriceSourceKind } from "@/lib/data/priceSource";
import type { BrokerQuote } from "@/lib/api/criptoya";
import { BrokerLogo } from "@/components/brokers/BrokerLogo";
import { fmtArs, fmtPct, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

/** CriptoYa timestamps are UNIX seconds; Bull Bitcoin's are ms. Normalize to ms. */
const toMillis = (t: number) => (t < 1e12 ? t * 1000 : t);

/** Normalized view model shared by the exchange and broker-ranking tables. */
export interface ExchangeDetailData {
  /** Display name. */
  name: string;
  /** Logo/avatar key (a CriptoYa broker key). */
  logoKey: string;
  /** Official site, if known. */
  url?: string;
  /** Custody model — only known for curated exchanges. */
  custodial?: boolean;
  /** Where the price comes from. */
  source: PriceSourceInfo;
  /** Live BTC/ARS quote, if the feed has one. */
  quote?: BrokerQuote;
  /** Curated entry, when present, unlocks the support + bitcoiner sections. */
  exchange?: ArExchange | null;
}

export function BitcoinerFeatureIcon({
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

export function FeatureToken({
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
        tone === "positive" ? "bg-up/10 text-up" : "bg-surface-2 text-muted",
      )}
    >
      <BitcoinerFeatureIcon featureKey={featureKey} className="h-3.5 w-3.5" />
      <span>{feature.label}</span>
    </span>
  );
}

/**
 * Score pill that reveals a full met/missing breakdown on hover/focus via a
 * portalled tooltip. Shared by the exchange table and the detail dialog header.
 */
export function BitcoinerBadge({ exchange }: { exchange: ArExchange }) {
  const score = bitcoinerLevel(exchange);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const tooltipId = `bitcoiner-tooltip-${exchange.key}`;
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

  const updatePosition = () => {
    const triggerRect = triggerRef.current?.getBoundingClientRect();
    if (!triggerRect) return;

    const margin = 12;
    const width = 288;
    const height = tooltipRef.current?.getBoundingClientRect().height ?? 240;
    const belowTop = triggerRect.bottom + 8;
    const aboveTop = triggerRect.top - height - 8;
    const fitsBelow = belowTop + height <= window.innerHeight - margin;
    const top = fitsBelow ? belowTop : Math.max(margin, aboveTop);
    const centeredLeft = triggerRect.left + triggerRect.width / 2 - width / 2;
    const left = Math.min(
      Math.max(centeredLeft, margin),
      window.innerWidth - width - margin,
    );

    setPosition({ left, top });
  };

  useEffect(() => {
    if (!open) return;

    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        aria-describedby={open ? tooltipId : undefined}
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

      {open &&
        createPortal(
          <span
            id={tooltipId}
            ref={tooltipRef}
            role="tooltip"
            className="pointer-events-none fixed z-[120] w-72 text-left"
            style={{ left: position.left, top: position.top }}
          >
            <span
              className="glass-popover block rounded-xl border p-3 shadow-2xl"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--surface) 94%, transparent)",
                borderColor:
                  "color-mix(in srgb, var(--border) 82%, var(--primary) 18%)",
              }}
            >
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
          </span>,
          document.body,
        )}
    </span>
  );
}

function SupportChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium",
        ok
          ? "border-up/30 bg-up/10 text-up"
          : "border-border bg-surface-2 text-muted",
      )}
    >
      <span aria-hidden>{ok ? "✓" : "✗"}</span>
      {label}
    </span>
  );
}

function PriceStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="glass-card-soft rounded-xl border p-3">
      <span className="block text-[11px] font-medium text-muted">{label}</span>
      <span
        className={cn(
          "mt-1 block font-mono text-base font-semibold tabular-nums",
          tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-fg",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
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
      <path d="M6 9L12 15L18 9" />
    </svg>
  );
}

const SOURCE_TONE: Record<PriceSourceKind, string> = {
  dedicated: "border-bitcoin/30 bg-bitcoin/10 text-bitcoin",
  aggregator: "border-primary/25 bg-primary-soft/15 text-primary",
  proxy: "border-gold/40 bg-gold/10 text-gold",
  none: "border-border bg-surface-2 text-muted",
};

const SOURCE_LABEL: Record<PriceSourceKind, string> = {
  dedicated: "Proveedor propio",
  aggregator: "Agregador",
  proxy: "Feed prestado",
  none: "Sin precio",
};

/**
 * Collapsible "where the data comes from" section. Collapsed by default; the
 * source-kind badge stays visible in the summary so the provenance is legible
 * at a glance without expanding.
 */
function SourceSection({
  source,
  name,
}: {
  source: PriceSourceInfo;
  name: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          De dónde salen los datos
        </span>
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              SOURCE_TONE[source.kind],
            )}
          >
            {SOURCE_LABEL[source.kind]}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
      </button>

      {open && (
        <div className="glass-card-soft mt-2 rounded-xl border p-3">
          <p className="text-sm font-semibold text-fg">{source.provider}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            {source.description}
          </p>
          {source.endpoint && (
            <p className="mt-2 break-all font-mono text-[11px] text-muted">
              <span className="text-fg">endpoint:</span> {source.endpoint}
            </p>
          )}
          {source.criptoyaKey && (
            <p className="mt-1 font-mono text-[11px] text-muted">
              <span className="text-fg">clave CriptoYa:</span>{" "}
              {source.criptoyaKey}
            </p>
          )}
          {source.proxyOf && (
            <p className="mt-2 rounded-lg border border-gold/30 bg-gold/10 px-2.5 py-1.5 text-[11px] text-gold">
              ⚠️ Ojo: el precio es de {source.proxyOf}, no de {name}.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export function ExchangeDetailDialog({
  data,
  onClose,
}: {
  data: ExchangeDetailData | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!data) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [data, onClose]);

  if (!data) return null;

  const { name, logoKey, url, custodial, source, quote, exchange } = data;
  const score = exchange ? bitcoinerLevel(exchange) : null;
  const met = exchange
    ? BITCOINER_FEATURE_KEYS.filter((key) => exchange.bitcoiner[key])
    : [];
  const missing = exchange
    ? BITCOINER_FEATURE_KEYS.filter((key) => !exchange.bitcoiner[key])
    : [];
  const hasBuy = quote !== undefined && quote.totalAsk > 0;
  const hasSell = quote !== undefined && quote.totalBid > 0;
  const hasSpread =
    quote !== undefined && Number.isFinite(quote.spread) && quote.spread > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exchange-detail-title"
        className="glass-popover w-full max-w-lg rounded-2xl border"
        style={{
          backgroundColor: "color-mix(in srgb, var(--surface) 97%, transparent)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="max-h-[85vh] overflow-y-auto p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrokerLogo brokerKey={logoKey} />
              <div>
                <h3
                  id="exchange-detail-title"
                  className="text-base font-semibold text-fg"
                >
                  {name}
                </h3>
                {(custodial !== undefined || url) && (
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px]">
                    {custodial !== undefined && (
                      <span className="text-muted">
                        {custodial ? "Custodial" : "No custodial"}
                      </span>
                    )}
                    {custodial !== undefined && url && (
                      <span aria-hidden className="text-muted">
                        ·
                      </span>
                    )}
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        Visitar sitio oficial ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {exchange && <BitcoinerBadge exchange={exchange} />}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-fg"
              >
                Cerrar
              </button>
            </div>
          </div>

          {/* Live quote */}
          <section className="mt-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Cotización en vivo (BTC/ARS)
            </h4>
            {source.kind === "none" ? (
              <p className="mt-2 text-sm text-muted">
                Este exchange no expone un feed de precio, así que no hay
                cotización para mostrar.
              </p>
            ) : quote ? (
              <>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <PriceStat
                    label="Compra"
                    value={hasBuy ? fmtArs(quote.totalAsk) : "—"}
                  />
                  <PriceStat
                    label="Venta"
                    value={hasSell ? fmtArs(quote.totalBid) : "—"}
                  />
                  <PriceStat
                    label="Spread"
                    value={hasSpread ? fmtPct(quote.spread * 100) : "—"}
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  Precio final con comisiones · actualizado{" "}
                  {timeAgo(toMillis(quote.time))}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                Esperando cotización del feed…
              </p>
            )}
          </section>

          {/* Source (collapsed by default) */}
          <SourceSection key={logoKey} source={source} name={name} />

          {/* Support + Bitcoiner level (curated exchanges only) */}
          {exchange ? (
            <>
              <section className="mt-4">
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Soporte Bitcoin
                </h4>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <SupportChip ok={exchange.btcOnchain} label="BTC on-chain" />
                  <SupportChip ok={exchange.lightning} label="Lightning" />
                  <SupportChip
                    ok={exchange.lightningAddressIn}
                    label="LN Address (recibir)"
                  />
                  <SupportChip
                    ok={exchange.lightningAddressOut}
                    label="LN Address (enviar)"
                  />
                </div>
              </section>

              <section className="mt-4">
                <div className="flex items-baseline justify-between">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Nivel Bitcoiner
                  </h4>
                  <span className="text-[11px] font-semibold tabular-nums text-fg">
                    {score}/10
                  </span>
                </div>

                <span className="mt-2 block text-[11px] text-up">Cumple</span>
                <span className="mt-1 flex flex-wrap gap-1">
                  {met.length > 0 ? (
                    met.map((key) => (
                      <FeatureToken key={key} featureKey={key} tone="positive" />
                    ))
                  ) : (
                    <span className="text-[11px] text-muted">ninguno</span>
                  )}
                </span>

                <span className="mt-2 block text-[11px] text-muted">Falta</span>
                <span className="mt-1 flex flex-wrap gap-1">
                  {missing.length > 0 ? (
                    missing.map((key) => (
                      <FeatureToken key={key} featureKey={key} tone="muted" />
                    ))
                  ) : (
                    <span className="text-[11px] text-up">nada</span>
                  )}
                </span>
              </section>
            </>
          ) : (
            <p className="mt-4 text-[11px] text-muted">
              Todavía no está en el índice Bitcoiner curado.{" "}
              <a
                href={AR_EXCHANGES_GITHUB_EDIT_URL}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Agregarlo en GitHub ↗
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
