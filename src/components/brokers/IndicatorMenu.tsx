"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { IndicatorPrefs } from "@/hooks/useBrokerIndicators";
import { cn } from "@/lib/cn";

const ITEMS: { key: keyof IndicatorPrefs; label: string; hint: string }[] = [
  { key: "difBitstamp", label: "Dif. Bitstamp", hint: "% vs precio internacional" },
  { key: "usdt", label: "Precio en USDT", hint: "BTC del broker en USDT" },
  { key: "subeBaja", label: "Sube / baja", hint: "▲▼ desde la última actualización" },
];

export function IndicatorMenu({
  prefs,
  onToggle,
}: {
  prefs: IndicatorPrefs;
  onToggle: (key: keyof IndicatorPrefs) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 240;
    const margin = 12;
    setPosition({
      top: rect.bottom + 8,
      left: Math.min(
        Math.max(rect.right - width, margin),
        window.innerWidth - width - margin,
      ),
    });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onMove = () => updatePosition();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  const active = Object.values(prefs).filter(Boolean).length;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Indicadores"
        aria-expanded={open}
        className="glass-pill inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium text-muted transition-colors hover:text-fg"
      >
        <SlidersIcon className="h-4 w-4" />
        Indicadores
        {active > 0 && (
          <span className="rounded bg-bitcoin/15 px-1 text-[10px] font-semibold text-bitcoin tabular-nums">
            {active}
          </span>
        )}
      </button>

      {open &&
        createPortal(
        <div
          ref={popoverRef}
          className="glass-popover !fixed z-50 w-60 rounded-xl border p-1.5 shadow-2xl"
          style={{ top: position.top, left: position.left }}
        >
          {ITEMS.map((it) => (
            <button
              key={it.key}
              type="button"
              onClick={() => onToggle(it.key)}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/20 dark:hover:bg-white/5"
            >
              <span className="flex flex-col">
                <span className="text-sm font-medium">{it.label}</span>
                <span className="text-[11px] text-muted">{it.hint}</span>
              </span>
              <Switch on={prefs[it.key]} />
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors",
        on ? "bg-bitcoin" : "bg-surface-2 ring-1 ring-border",
      )}
    >
      <span
        className={cn(
          "inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform",
          on ? "translate-x-3.5" : "translate-x-0.5",
        )}
      />
    </span>
  );
}

function SlidersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}
