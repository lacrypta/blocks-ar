"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { SatParityHero } from "@/components/price/SatParityHero";
import { BitstampMarketWidget } from "@/components/price/BitstampMarketWidget";
import { DollarBlock } from "@/components/dollars/DollarBlock";

const NetworkBlock = dynamic(
  () => import("@/components/network/NetworkBlock").then((m) => m.NetworkBlock),
  { ssr: false },
);
const BrokerRankingTable = dynamic(
  () =>
    import("@/components/brokers/BrokerRankingTable").then(
      (m) => m.BrokerRankingTable,
    ),
  { ssr: false },
);
const ArExchangeSupportTable = dynamic(
  () =>
    import("@/components/arexchanges/ArExchangeSupportTable").then(
      (m) => m.ArExchangeSupportTable,
    ),
  { ssr: false },
);

function DeferredWidget({
  id,
  className,
  eager = false,
  render,
}: {
  id: string;
  className: string;
  eager?: boolean;
  render: () => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (eager) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [eager]);

  return (
    <div ref={ref} id={id} className={className}>
      {visible && render()}
    </div>
  );
}

export interface WidgetDef {
  id: string;
  title: string;
  span: "full" | "half";
  render: (eager?: boolean) => ReactNode;
}

export const WIDGETS: Record<string, WidgetDef> = {
  paridad: {
    id: "paridad",
    title: "1 SAT = X ARS",
    span: "full",
    render: () => <SatParityHero />,
  },
  precio: {
    id: "precio",
    title: "Bitstamp BTC/USD",
    span: "half",
    render: () => <BitstampMarketWidget />,
  },
  dolares: {
    id: "dolares",
    title: "Dólares",
    span: "half",
    render: () => <DollarBlock />,
  },
  red: {
    id: "red",
    title: "Red Bitcoin",
    span: "full",
    render: (eager) => (
      <DeferredWidget
        id="red"
        className="min-h-[330px] lg:min-h-[286px]"
        eager={eager}
        render={() => <NetworkBlock />}
      />
    ),
  },
  brokers: {
    id: "brokers",
    title: "Brokers argentinos",
    span: "full",
    render: (eager) => (
      <DeferredWidget
        id="brokers"
        className="min-h-[720px] lg:min-h-[629px]"
        eager={eager}
        render={() => <BrokerRankingTable />}
      />
    ),
  },
  "exchanges-ar": {
    id: "exchanges-ar",
    title: "Top Exchanges (Bitcoiner Index)",
    span: "full",
    render: (eager) => (
      <DeferredWidget
        id="exchanges"
        className="min-h-[1750px] lg:min-h-[1711px]"
        eager={eager}
        render={() => <ArExchangeSupportTable />}
      />
    ),
  },
};
