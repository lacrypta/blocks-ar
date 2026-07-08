"use client";

import { useExchangeStats } from "@/hooks/useExchangeStats";
import { StatusDot } from "@/components/ui/StatusDot";
import { EXCHANGE_IDS } from "@/lib/ws/exchanges";

export function OnlineIndicator() {
  const { anyOnline, onlineCount } = useExchangeStats();
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium">
      <StatusDot online={anyOnline} />
      <span className={anyOnline ? "text-online" : "text-offline"}>
        {anyOnline ? "ONLINE" : "OFFLINE"}
      </span>
      <span className="text-muted tabular-nums">
        {onlineCount}/{EXCHANGE_IDS.length}
      </span>
    </div>
  );
}
