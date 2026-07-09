"use client";

import Link from "next/link";
import { useBtcArs } from "@/hooks/useBtcArs";
import { satToArs } from "@/lib/calc/satArs";
import { SatSymbol } from "@/components/icons/SatSymbol";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BrandLogo } from "./BrandLogo";
import { WidgetEditButton } from "@/components/widgets/WidgetEditButton";

const NAV = [
  { href: "#paridad", label: "Paridad" },
  { href: "#precio", label: "Precio" },
  { href: "#dolares", label: "Dólares" },
  { href: "#brokers", label: "Brokers" },
  { href: "#exchanges", label: "Exchanges" },
  { href: "#red", label: "Red" },
];

const HEADER_SAT_ARS = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function Header() {
  const { value: btcArs } = useBtcArs();
  const satArs =
    btcArs !== undefined && Number.isFinite(btcArs) ? satToArs(btcArs) : undefined;
  const satArsLabel =
    satArs !== undefined && Number.isFinite(satArs)
      ? HEADER_SAT_ARS.format(satArs)
      : "—";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="Blocks.AR — inicio">
          <BrandLogo />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted sm:inline-flex">
          <span className="inline-flex items-center gap-1">
            <span>1</span>
            <SatSymbol
              title="sat"
              className="h-3.5 text-black dark:text-white"
            />
            <span>=</span>
          </span>
          <span className="font-semibold text-fg">{satArsLabel}</span>
          <span>ARS</span>
        </div>

        <div className="flex items-center gap-2.5">
          <WidgetEditButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
