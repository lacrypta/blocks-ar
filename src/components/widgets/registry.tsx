import type { ReactNode } from "react";
import { SatParityHero } from "@/components/price/SatParityHero";
import { ExchangeFeedGrid } from "@/components/exchanges/ExchangeFeedGrid";
import { PriceUsdPanel } from "@/components/price/PriceUsdPanel";
import { DollarBlock } from "@/components/dollars/DollarBlock";
import { NetworkBlock } from "@/components/network/NetworkBlock";
import { BrokerRankingTable } from "@/components/brokers/BrokerRankingTable";
import { ArExchangeSupportTable } from "@/components/arexchanges/ArExchangeSupportTable";

export interface WidgetDef {
  id: string;
  title: string;
  span: "full" | "half";
  render: () => ReactNode;
}

function ExchangesIntlWidget() {
  return (
    <section id="precio" className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted">
        Exchanges internacionales
      </h2>
      <ExchangeFeedGrid />
      <PriceUsdPanel />
    </section>
  );
}

export const WIDGETS: Record<string, WidgetDef> = {
  paridad: {
    id: "paridad",
    title: "1 SAT = X ARS",
    span: "full",
    render: () => <SatParityHero />,
  },
  "exchanges-intl": {
    id: "exchanges-intl",
    title: "Exchanges internacionales",
    span: "full",
    render: () => <ExchangesIntlWidget />,
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
    span: "half",
    render: () => <NetworkBlock />,
  },
  brokers: {
    id: "brokers",
    title: "Brokers argentinos",
    span: "full",
    render: () => <BrokerRankingTable />,
  },
  "exchanges-ar": {
    id: "exchanges-ar",
    title: "Top Exchanges (Bitcoiner Index)",
    span: "full",
    render: () => <ArExchangeSupportTable />,
  },
};
