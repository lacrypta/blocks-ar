import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { OnlineIndicator } from "./OnlineIndicator";
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

export function Header() {
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

        <div className="ml-auto flex items-center gap-2.5">
          <OnlineIndicator />
          <WidgetEditButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
