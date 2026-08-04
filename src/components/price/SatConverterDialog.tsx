"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useBtcArs } from "@/hooks/useBtcArs";
import { useDollars } from "@/hooks/useDollars";
import { BrokerLogo } from "@/components/brokers/BrokerLogo";
import { SatSymbol } from "@/components/icons/SatSymbol";
import { brokerName } from "@/lib/data/brokerNames";
import { SATS_PER_BTC } from "@/lib/calc/satArs";
import { fmtArs } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { BrokerQuote } from "@/lib/api/criptoya";

/** Sentinel source: the market median already shown by the hero. */
export const MARKET_SOURCE_KEY = "market";

type Fiat = "ARS" | "USD";
type Field = "sat" | "fiat";

interface SourceOption {
  key: string;
  name: string;
  /** BTC price in ARS this source quotes. */
  price?: number;
}

/** A broker's representative BTC/ARS price: mid when two-sided, else its one side. */
const quotePrice = (q: BrokerQuote) =>
  q.totalAsk > 0 && q.totalBid > 0
    ? (q.totalAsk + q.totalBid) / 2
    : q.totalAsk > 0
      ? q.totalAsk
      : q.totalBid;

/**
 * Parse a typed amount, es-AR first: comma is the decimal separator and dots
 * group thousands. A lone dot that does not split a 3-digit group is read as a
 * decimal point too, so "0.5" works as well as "0,5" and "1.000" stays 1000.
 */
function parseAmount(input: string): number | undefined {
  const cleaned = input.replace(/[^\d.,]/g, "");
  if (!cleaned) return undefined;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalAt =
    lastComma >= 0
      ? lastComma
      : lastDot >= 0 && cleaned.length - lastDot - 1 !== 3
        ? lastDot
        : -1;

  const digits = (s: string) => s.replace(/[.,]/g, "");
  const whole = digits(decimalAt >= 0 ? cleaned.slice(0, decimalAt) : cleaned);
  const frac = decimalAt >= 0 ? digits(cleaned.slice(decimalAt + 1)) : "";
  const value = Number(`${whole || "0"}.${frac || "0"}`);

  return Number.isFinite(value) ? value : undefined;
}

/** Computed side of the conversion: precision grows as the amount shrinks. */
function showAmount(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return "";
  const abs = Math.abs(value);
  const decimals = abs === 0 || abs >= 1 ? 2 : abs >= 0.01 ? 4 : 8;
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Drop group separators so a computed value stays editable once focused. */
const toEditable = (value: string) => value.replace(/\./g, "");

/** Case- and accent-insensitive, so "cocos" finds "Cocos Crypto". */
const fold = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const matchesQuery = (name: string, query: string) =>
  query.trim() === "" || fold(name).includes(fold(query.trim()));

function SwapIcon({ className }: { className?: string }) {
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
      <path d="M8 21V3" />
      <path d="M4.5 6.5L8 3L11.5 6.5" />
      <path d="M16 3V21" />
      <path d="M12.5 17.5L16 21L19.5 17.5" />
    </svg>
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L16 16" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6L18 18" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

/** Market median gets the same round chip the hero uses for its bitcoin mark. */
function SourceAvatar({ sourceKey }: { sourceKey: string }) {
  if (sourceKey === MARKET_SOURCE_KEY) {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bitcoin/15 text-bitcoin">
        ₿
      </span>
    );
  }
  return <BrokerLogo brokerKey={sourceKey} />;
}

/**
 * Which exchange's quote drives the conversion. Portalled like the other
 * popovers in the app so the modal's own box never clips the list.
 */
function SourcePicker({
  options,
  selected,
  onSelect,
}: {
  options: SourceOption[];
  selected: SourceOption;
  onSelect: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const margin = 12;
    const height = listRef.current?.getBoundingClientRect().height ?? 260;
    const belowTop = rect.bottom + 6;
    const fitsBelow = belowTop + height <= window.innerHeight - margin;
    setPosition({
      top: fitsBelow ? belowTop : Math.max(margin, rect.top - height - 6),
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!open) return;

    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };
    const onMove = () => updatePosition();

    document.addEventListener("mousedown", onDown);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  // Filtering shrinks the list, so a popover opened upwards has to re-anchor.
  useEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, query]);

  const matches = options.filter((option) => matchesQuery(option.name, query));

  const pick = (key: string) => {
    onSelect(key);
    close();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Exchange de la cotización"
        className="glass-input flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors hover:border-primary/40"
      >
        <SourceAvatar sourceKey={selected.key} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
          {selected.name}
        </span>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
          {fmtArs(selected.price)}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={listRef}
            className="glass-popover !fixed z-[120] rounded-xl border p-1.5 shadow-2xl"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              // Opaque: the list floats over the dialog, not over the page.
              backgroundColor:
                "color-mix(in srgb, var(--surface) 97%, transparent)",
            }}
          >
            <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-2.5">
              <SearchIcon className="h-3.5 w-3.5 shrink-0 text-muted" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  // Escape belongs to the popover first — the dialog's own
                  // window listener would otherwise close everything at once.
                  if (event.key === "Escape") {
                    event.stopPropagation();
                    close();
                  }
                  if (event.key === "Enter" && matches[0]) {
                    event.preventDefault();
                    pick(matches[0].key);
                  }
                }}
                placeholder="Buscar"
                aria-label="Buscar exchange"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-fg outline-none placeholder:text-muted"
              />
            </div>

            <div
              role="listbox"
              aria-label="Exchange de la cotización"
              className="mt-1 max-h-56 overflow-y-auto"
            >
              {matches.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  role="option"
                  aria-selected={option.key === selected.key}
                  onClick={() => pick(option.key)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/20 dark:hover:bg-white/5",
                    option.key === selected.key && "bg-primary/10",
                  )}
                >
                  <SourceAvatar sourceKey={option.key} />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {option.name}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
                    {fmtArs(option.price)}
                  </span>
                </button>
              ))}

              {matches.length === 0 && (
                <p className="px-2 py-3 text-center text-[11px] text-muted">
                  Sin resultados
                </p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function AmountField({
  value,
  onChange,
  onFocus,
  label,
  unit,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  label: string;
  unit: ReactNode;
  autoFocus?: boolean;
}) {
  return (
    <div className="glass-input flex items-center gap-2 rounded-xl border px-3 py-2.5">
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(event) =>
          onChange(event.target.value.replace(/[^\d.,]/g, ""))
        }
        onFocus={onFocus}
        inputMode="decimal"
        placeholder="0"
        aria-label={label}
        className="min-w-0 flex-1 bg-transparent font-mono text-xl font-semibold tabular-nums text-fg outline-none placeholder:text-muted"
      />
      {unit}
    </div>
  );
}

/**
 * Two-way SAT ↔ ARS/USD converter. One field is always the source of truth (the
 * one last typed in); the other is derived, so a refreshed quote re-computes it
 * on the spot. USD rides on the crypto dollar, keeping the picked exchange's
 * quote meaningful in both currencies.
 */
export function SatConverterDialog({
  open,
  onClose,
  sourceKey,
  onSourceChange,
}: {
  open: boolean;
  onClose: () => void;
  sourceKey: string;
  onSourceChange: (key: string) => void;
}) {
  const { value: marketBtcArs, brokers } = useBtcArs();
  const { data: dollars } = useDollars();
  const [input, setInput] = useState<{ field: Field; value: string }>({
    field: "sat",
    value: "1",
  });
  const [fiat, setFiat] = useState<Fiat>("ARS");
  const [satFirst, setSatFirst] = useState(true);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const options = useMemo<SourceOption[]>(() => {
    const fromBrokers = brokers
      .map((quote) => ({
        key: quote.key,
        name: brokerName(quote.key),
        price: quotePrice(quote),
      }))
      .filter((option) => option.price > 0)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    return [
      { key: MARKET_SOURCE_KEY, name: "Mercado (mediana)", price: marketBtcArs },
      ...fromBrokers,
    ];
  }, [brokers, marketBtcArs]);

  const selected =
    options.find((option) => option.key === sourceKey) ?? options[0];

  const usdRate = dollars?.cripto?.value;
  const btcArs = selected?.price;
  const satArs = btcArs !== undefined ? btcArs / SATS_PER_BTC : undefined;
  const satFiat =
    satArs === undefined
      ? undefined
      : fiat === "ARS"
        ? satArs
        : usdRate && usdRate > 0
          ? satArs / usdRate
          : undefined;

  const typed = parseAmount(input.value);
  const converted =
    typed === undefined || satFiat === undefined || satFiat <= 0
      ? undefined
      : input.field === "sat"
        ? typed * satFiat
        : typed / satFiat;

  const satValue =
    input.field === "sat" ? input.value : showAmount(converted);
  const fiatValue =
    input.field === "fiat" ? input.value : showAmount(converted);

  /** Focusing the derived field hands it the source role, seeded with its value. */
  const focusField = (field: Field, current: string) =>
    setInput((prev) =>
      prev.field === field ? prev : { field, value: toEditable(current) },
    );

  /** Switching currency re-anchors on the sat amount, so 1 sat stays 1 sat. */
  const selectFiat = (next: Fiat) => {
    setFiat(next);
    setInput((prev) =>
      prev.field === "sat" ? prev : { field: "sat", value: toEditable(satValue) },
    );
  };

  if (!open) return null;

  const satField = (
    <AmountField
      key="sat"
      autoFocus={input.field === "sat"}
      value={satValue}
      onChange={(value) => setInput({ field: "sat", value })}
      onFocus={() => focusField("sat", satValue)}
      label="Cantidad en satoshis"
      unit={
        <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-surface-2 px-2.5 text-xs font-semibold text-muted">
          <SatSymbol className="h-3.5 text-fg" />
          sat
        </span>
      }
    />
  );

  const fiatField = (
    <AmountField
      key="fiat"
      autoFocus={input.field === "fiat"}
      value={fiatValue}
      onChange={(value) => setInput({ field: "fiat", value })}
      onFocus={() => focusField("fiat", fiatValue)}
      label={`Cantidad en ${fiat}`}
      unit={
        <span className="glass-pill inline-flex h-8 shrink-0 items-center overflow-hidden rounded-lg border p-0.5">
          {(["ARS", "USD"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => selectFiat(code)}
              aria-pressed={fiat === code}
              className={cn(
                "h-6 rounded-md px-2 text-[11px] font-semibold transition-colors",
                fiat === code
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:bg-white/20 hover:text-fg dark:hover:bg-white/5",
              )}
            >
              {code}
            </button>
          ))}
        </span>
      }
    />
  );

  // Portalled out of the hero card: its backdrop-filter would otherwise become
  // the containing block for the fixed overlay and clip it.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sat-converter-title"
        className="glass-popover w-full max-w-sm rounded-2xl border"
        style={{
          backgroundColor: "color-mix(in srgb, var(--surface) 97%, transparent)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h3
              id="sat-converter-title"
              className="text-sm font-semibold text-fg"
            >
              Convertir
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="grid h-7 w-7 place-items-center rounded-full border border-border text-muted transition-colors hover:text-fg"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {satFirst ? satField : fiatField}

            <div className="relative z-10 -my-3 flex justify-center">
              <button
                type="button"
                onClick={() => setSatFirst((prev) => !prev)}
                aria-label="Invertir"
                className="glass-pill grid h-9 w-9 place-items-center rounded-full border text-muted transition-colors hover:text-fg"
              >
                <SwapIcon className="h-4 w-4" />
              </button>
            </div>

            {satFirst ? fiatField : satField}
          </div>

          <div className="mt-5">
            {selected && (
              <SourcePicker
                options={options}
                selected={selected}
                onSelect={onSourceChange}
              />
            )}
            <p className="mt-2 text-[11px] text-muted">
              1 BTC ={" "}
              <span className="font-medium text-fg">{fmtArs(btcArs)}</span>
              {fiat === "USD" && (
                <>
                  {" · "}dólar cripto{" "}
                  <span className="font-medium text-fg">{fmtArs(usdRate)}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
