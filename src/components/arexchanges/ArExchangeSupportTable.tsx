"use client";

import { useMemo, useState } from "react";
import { AR_EXCHANGES } from "@/lib/data/arExchanges";
import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

function YesNo({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
        ok ? "bg-up/15 text-up" : "bg-offline/15 text-offline",
      )}
      aria-label={ok ? "Sí" : "No"}
    >
      {ok ? "✓" : "✗"}
    </span>
  );
}

export function ArExchangeSupportTable() {
  const [onlyLnAddress, setOnlyLnAddress] = useState(false);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    return AR_EXCHANGES.filter((e) => {
      if (onlyLnAddress && !e.lightningAddress) return false;
      if (query && !e.name.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [onlyLnAddress, query]);

  return (
    <Card>
      <CardTitle
        id="exchanges"
        right={
          <label className="flex items-center gap-1.5 text-[11px] text-muted">
            <input
              type="checkbox"
              checked={onlyLnAddress}
              onChange={(e) => setOnlyLnAddress(e.target.checked)}
              className="accent-bitcoin"
            />
            Solo Lightning Address
          </label>
        }
      >
        Exchanges argentinos — Bitcoin & Lightning
      </CardTitle>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar exchange…"
        className="mb-3 w-full rounded-lg border border-border bg-surface-2/40 px-3 py-1.5 text-sm outline-none focus:border-primary"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="py-2 pr-2 font-medium">Exchange</th>
              <th className="py-2 px-2 text-center font-medium">BTC on-chain</th>
              <th className="py-2 px-2 text-center font-medium">Lightning</th>
              <th className="py-2 px-2 text-center font-medium">LN Address</th>
              <th className="py-2 pl-2 text-center font-medium">Custodia</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr
                key={e.key}
                className="border-t border-border hover:bg-surface-2/50"
              >
                <td className="py-2.5 pr-2 font-medium">
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary"
                  >
                    {e.name}
                  </a>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <YesNo ok={e.btcOnchain} />
                </td>
                <td className="py-2.5 px-2 text-center">
                  <YesNo ok={e.lightning} />
                </td>
                <td className="py-2.5 px-2 text-center">
                  <YesNo ok={e.lightningAddress} />
                </td>
                <td className="py-2.5 pl-2 text-center text-[11px] text-muted">
                  {e.custodial ? "Custodial" : "No custodial"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-muted">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-muted">
        ⚠️ Datos informativos, a verificar con cada plataforma — el soporte de
        Lightning cambia seguido.
      </p>
    </Card>
  );
}
