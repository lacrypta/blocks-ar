import { cn } from "@/lib/cn";

/**
 * Blocks.AR isotype — a "B" built from stacked blocks (a Bitcoin block motif),
 * using the Argentina celeste + Bitcoin orange brand colors.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Blocks.AR"
      fill="none"
    >
      {/* left spine block */}
      <rect x="4" y="4" width="8" height="24" rx="2.5" fill="var(--primary)" />
      {/* top bowl block */}
      <rect
        x="14"
        y="4"
        width="14"
        height="10.5"
        rx="3"
        fill="var(--primary-soft)"
      />
      {/* bottom bowl block */}
      <rect
        x="14"
        y="17.5"
        width="14"
        height="10.5"
        rx="3"
        fill="var(--bitcoin)"
      />
    </svg>
  );
}

/** Full brand lockup: isotype + "Blocks.AR" wordmark + optional tagline. */
export function BrandLogo({
  className,
  tagline = true,
}: {
  className?: string;
  tagline?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 p-1.5 ring-1 ring-border">
        <BrandMark className="h-full w-full" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-extrabold tracking-tight">
          Blocks<span className="text-bitcoin">.AR</span>
        </span>
        {tagline && (
          <span className="text-[11px] text-muted">Sats argentos 🇦🇷</span>
        )}
      </span>
    </span>
  );
}
