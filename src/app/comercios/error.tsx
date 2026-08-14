"use client";

export default function MerchantsError({ reset }: { reset: () => void }) {
  return (
    <div className="glass-card rounded-2xl border p-10 text-center">
      <h1 className="text-xl font-bold">No pudimos cargar los comercios</h1>
      <p className="mt-2 text-sm text-muted">
        BTC Map no está respondiendo. Podés intentar nuevamente.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-lg bg-bitcoin px-4 py-2 text-sm font-semibold text-white"
      >
        Reintentar
      </button>
    </div>
  );
}
