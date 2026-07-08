"use client";

import { useExchangeStore } from "@/store/useExchangeStore";
import { EXCHANGES } from "@/lib/ws/exchanges";
import { StatusDot } from "@/components/ui/StatusDot";
import { fmtUsd, fmtPct } from "@/lib/format";
import { cn } from "@/lib/cn";

export function ExchangeFeedGrid() {
  const feeds = useExchangeStore((s) => s.feeds);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {EXCHANGES.map((ex) => {
        const f = feeds[ex.id];
        const online = f.status === "online";
        const up = (f.changePct ?? 0) >= 0;
        return (
          <div
            key={ex.id}
            className="rounded-xl border border-border bg-surface p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{ex.name}</span>
              <StatusDot online={online} pulse={false} />
            </div>
            <div className="mt-1.5 font-mono text-base font-semibold tabular-nums">
              {fmtUsd(f.price, true)}
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[11px]">
              <span className="text-muted">{ex.quote}</span>
              {f.changePct !== undefined && (
                <span className={cn(up ? "text-up" : "text-down")}>
                  {fmtPct(f.changePct)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
