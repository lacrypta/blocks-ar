"use client";

import { useState } from "react";
import { brokerName } from "@/lib/data/brokerNames";
import { BROKER_LOGO_KEYS } from "@/lib/data/brokerLogos";
import { brokerDisplayKey } from "@/lib/data/brokerPresentation";
import { cn } from "@/lib/cn";

/**
 * Official broker logo (sourced from CriptoYa, self-hosted under /public/brokers).
 * Renders the <img> only for keys we actually ship a logo for; unknown/new
 * brokers go straight to an initial-letter avatar (no 404 request). Logos sit
 * on a white chip so both light and dark marks stay legible in any theme.
 * The image is decorative (alt="") — the broker name is shown as text alongside.
 */
export function BrokerLogo({
  brokerKey,
  className,
}: {
  brokerKey: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const name = brokerName(brokerKey);
  const displayKey = brokerDisplayKey(brokerKey);
  const showImg = BROKER_LOGO_KEYS.has(displayKey) && !failed;

  return (
    <span
      className={cn(
        "grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-white",
        className,
      )}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/brokers/${displayKey}.png`}
          alt=""
          width={22}
          height={22}
          loading="lazy"
          decoding="async"
          className="h-[22px] w-[22px] object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[11px] font-bold text-zinc-700">
          {name.charAt(0)}
        </span>
      )}
    </span>
  );
}
