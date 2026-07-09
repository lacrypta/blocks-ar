"use client";

import Link from "next/link";
import { useBtcArs } from "@/hooks/useBtcArs";
import { satToArs } from "@/lib/calc/satArs";
import { SatSymbol } from "@/components/icons/SatSymbol";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BrandLogo } from "./BrandLogo";
import { MempoolFeeBadge } from "./MempoolFeeBadge";
import { WidgetEditButton } from "@/components/widgets/WidgetEditButton";
import { useWidgetLayout } from "@/store/useWidgetLayout";

const NAV_BY_WIDGET: Record<string, { href: string; label: string }> = {
  paridad: { href: "#paridad", label: "Paridad" },
  precio: { href: "#precio", label: "Precio" },
  dolares: { href: "#dolares", label: "Dólares" },
  red: { href: "#red", label: "Red" },
  brokers: { href: "#brokers", label: "Brokers" },
  "exchanges-ar": { href: "#exchanges", label: "Exchanges" },
};

const HEADER_SAT_ARS = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function Header() {
  const { value: btcArs } = useBtcArs();
  const { order, hidden } = useWidgetLayout();
  const satArs =
    btcArs !== undefined && Number.isFinite(btcArs) ? satToArs(btcArs) : undefined;
  const satArsLabel =
    satArs !== undefined && Number.isFinite(satArs)
      ? HEADER_SAT_ARS.format(satArs)
      : "—";
  const hiddenSet = new Set(hidden);
  const navItems = order
    .filter((id) => NAV_BY_WIDGET[id] && !hiddenSet.has(id))
    .map((id) => NAV_BY_WIDGET[id]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/15 bg-bg/60 backdrop-blur-xl dark:border-white/8">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <Link href="/" aria-label="Blocks.AR — inicio">
          <BrandLogo />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <a
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          <MempoolFeeBadge />
          <a
            href="https://1satoshi1peso.ar/ARS"
            aria-label="Abrir 1Satoshi1Peso"
            title="Ver 1 sat = 1 peso"
            className="glass-pill inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium text-muted transition-colors hover:text-fg"
          >
            <span className="inline-flex items-center gap-1">
              <span>1</span>
              <SatSymbol
                title="sat"
                className="h-4 text-black dark:text-white"
              />
              <span>=</span>
            </span>
            <span className="font-semibold text-fg">{satArsLabel}</span>
            <span>ARS</span>
          </a>
          <WidgetEditButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
