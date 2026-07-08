import { cn } from "@/lib/cn";

/** Small colored status dot: green online, gray/red offline. */
export function StatusDot({
  online,
  className,
  pulse = true,
}: {
  online: boolean;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex h-2.5 w-2.5", className)}>
      {online && pulse && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-online opacity-60" />
      )}
      <span
        className={cn(
          "relative inline-flex h-2.5 w-2.5 rounded-full",
          online ? "bg-online" : "bg-offline",
        )}
      />
    </span>
  );
}
