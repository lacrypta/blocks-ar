import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MerchantProfile } from "@/components/merchants/MerchantProfile";
import { getMerchant } from "@/lib/merchants/server";

async function resolveMerchant(rawId: string) {
  return /^\d+$/.test(rawId) ? getMerchant(Number(rawId)) : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/comercios/[id]">): Promise<Metadata> {
  const { id } = await params;
  const merchant = await resolveMerchant(id);
  if (!merchant) return { title: "Comercio no encontrado | Blocks.AR" };
  return {
    title: `${merchant.name} acepta Bitcoin | Blocks.AR`,
    description: [merchant.description, merchant.address]
      .filter(Boolean)
      .join(" — ")
      .slice(0, 160),
    alternates: { canonical: `/comercios/${merchant.id}` },
  };
}

export default async function MerchantPage({ params }: PageProps<"/comercios/[id]">) {
  const { id } = await params;
  const merchant = await resolveMerchant(id);
  if (!merchant) notFound();
  return <MerchantProfile merchant={merchant} />;
}
