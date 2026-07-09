import type { ReactNode } from "react";
import { SatParityHero } from "@/components/price/SatParityHero";
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

export const WIDGETS: Record<string, WidgetDef> = {
  paridad: {
    id: "paridad",
    title: "1 SAT = X ARS",
    span: "full",
    render: () => <SatParityHero />,
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
