import Link from "next/link";

export default function MerchantNotFound() {
  return (
    <div className="glass-card rounded-2xl border p-10 text-center">
      <h1 className="text-xl font-bold">Comercio no encontrado</h1>
      <p className="mt-2 text-sm text-muted">
        El comercio no existe, fue eliminado o no está dentro de Argentina.
      </p>
      <Link
        href="/comercios"
        className="mt-5 inline-block rounded-lg bg-bitcoin px-4 py-2 text-sm font-semibold text-white"
      >
        Ver comercios
      </Link>
    </div>
  );
}
