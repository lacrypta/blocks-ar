import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl border p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  right,
  id,
}: {
  children: ReactNode;
  right?: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-muted">{children}</h2>
      {right}
    </div>
  );
}
