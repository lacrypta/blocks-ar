import { cn } from "@/lib/cn";
import type { ProviderKey } from "@/lib/data/swapProviders";

const ACCENT: Record<ProviderKey, string> = {
  wapu: "text-primary ring-primary/30 bg-primary/10",
  bullbitcoin: "text-bitcoin ring-bitcoin/30 bg-bitcoin/10",
  boltz: "text-gold ring-gold/35 bg-gold/10",
};

const INITIALS: Record<ProviderKey, string> = {
  wapu: "W",
  bullbitcoin: "BB",
  boltz: "BZ",
};

export function ProviderMark({
  providerKey,
  size = "md",
}: {
  providerKey: ProviderKey;
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-mono font-bold ring-1",
        ACCENT[providerKey],
        size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs",
      )}
    >
      {INITIALS[providerKey]}
    </span>
  );
}
