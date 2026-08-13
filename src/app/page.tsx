import { WidgetDashboard } from "@/components/widgets/WidgetDashboard";

export default function Home() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Bitcoin en pesos argentinos
        </h1>
        <p className="mt-1 text-sm text-muted">
          Precio de BTC, satoshis, dólar y red Bitcoin en tiempo real.
        </p>
      </div>
      <WidgetDashboard />
    </>
  );
}
