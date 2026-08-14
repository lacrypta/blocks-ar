import type { Metadata } from "next";
import { MerchantExplorer } from "@/components/merchants/MerchantExplorer";
import { getArgentinaMerchants } from "@/lib/merchants/server";

export const metadata: Metadata = {
  title: "Comercios que aceptan Bitcoin en Argentina | Blocks.AR",
  description:
    "Mapa y listado de comercios argentinos que aceptan Bitcoin, con datos de BTC Map y OpenStreetMap.",
  alternates: { canonical: "/comercios" },
};

export default async function MerchantsPage() {
  const merchants = await getArgentinaMerchants();

  return (
    <>
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-bitcoin">
          Gastá tus sats
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Comercios que aceptan Bitcoin
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Encontrá dónde pagar con Bitcoin en Argentina. Datos colaborativos de{" "}
          <a
            href="https://btcmap.org"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
          >
            BTC Map
          </a>
          .
        </p>
      </div>
      <MerchantExplorer merchants={merchants} />
    </>
  );
}
