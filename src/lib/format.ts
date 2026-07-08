const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const ARS2 = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

const USD = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const USD2 = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const PCT = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export const fmtArs = (v?: number, decimals = false) =>
  v === undefined || !Number.isFinite(v) ? "—" : (decimals ? ARS2 : ARS).format(v);

export const fmtUsd = (v?: number, decimals = false) =>
  v === undefined || !Number.isFinite(v) ? "—" : (decimals ? USD2 : USD).format(v);

/** Sats/ARS value: shown with enough precision to be meaningful near parity. */
export const fmtSatArs = (v?: number) => {
  if (v === undefined || !Number.isFinite(v)) return "—";
  const decimals = v >= 1 ? 2 : v >= 0.1 ? 3 : 4;
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v);
};

export const fmtPct = (v?: number) => {
  if (v === undefined || !Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${PCT.format(v)}%`;
};

export const fmtNumber = (v?: number, decimals = 0) =>
  v === undefined || !Number.isFinite(v)
    ? "—"
    : new Intl.NumberFormat("es-AR", {
        maximumFractionDigits: decimals,
      }).format(v);

/** Relative time like "hace 3s" from a timestamp in ms. */
export const timeAgo = (ts?: number) => {
  if (!ts) return "—";
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `hace ${s}s`;
  const m = Math.round(s / 60);
  return `hace ${m}m`;
};
