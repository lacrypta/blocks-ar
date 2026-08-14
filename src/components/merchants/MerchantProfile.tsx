import Link from "next/link";
import {
  merchantCategoryInfo,
  type Merchant,
} from "@/lib/merchants/model";
import {
  btcMapMerchantUrl,
  googleMapsSearchUrl,
} from "@/lib/merchants/server";
import { GooglePlaceDetails } from "./GooglePlaceDetails";

export function MerchantProfile({ merchant }: { merchant: Merchant }) {
  const category = merchantCategoryInfo(merchant.category);
  const verifiedDate = merchant.verifiedAt
    ? new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(
        new Date(merchant.verifiedAt),
      )
    : undefined;

  return (
    <article className="mx-auto max-w-4xl">
      <Link
        href="/comercios"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-fg"
      >
        ← Volver a Comercios
      </Link>

      <header className="glass-card overflow-hidden rounded-3xl border">
        <div
          className="relative h-48 overflow-hidden sm:h-64"
          style={{
            background: `radial-gradient(circle at 75% 20%, ${category.color}aa, transparent 32%), linear-gradient(135deg, ${category.color}55, var(--surface-2))`,
          }}
        >
          {merchant.image && (
            // External merchant images are user-provided BTC Map data.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={merchant.image}
              alt={`Imagen de ${merchant.name}`}
              className="h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          <span className="absolute bottom-4 right-5 text-6xl font-black text-white/90 sm:text-8xl">
            ₿
          </span>
        </div>

        <div className="relative z-10 p-5 sm:p-7">
          <div className="-mt-16 mb-4 flex items-end justify-between gap-3 sm:-mt-20">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-surface text-4xl font-black text-white shadow-xl sm:h-28 sm:w-28"
              style={{ backgroundColor: category.color }}
              aria-hidden="true"
            >
              ₿
            </div>
            <span className="rounded-full bg-bitcoin/15 px-3 py-1.5 text-xs font-semibold text-bitcoin">
              Acepta Bitcoin
            </span>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {category.label}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {merchant.name}
          </h1>
          {merchant.address && <p className="mt-2 text-sm text-muted">{merchant.address}</p>}

          {merchant.description && (
            <p className="mt-5 max-w-2xl text-sm leading-6 text-fg/85">
              {merchant.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <PaymentChip active>Bitcoin</PaymentChip>
            <PaymentChip active={merchant.payments.onchain}>On-chain</PaymentChip>
            <PaymentChip active={merchant.payments.lightning}>Lightning</PaymentChip>
            <PaymentChip active={merchant.payments.contactless}>Lightning NFC</PaymentChip>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {merchant.website && <ActionLink href={merchant.website}>Sitio web</ActionLink>}
            {merchant.phone && <ActionLink href={`tel:${merchant.phone}`}>Llamar</ActionLink>}
            {merchant.instagram && <ActionLink href={merchant.instagram}>Instagram</ActionLink>}
            {merchant.email && <ActionLink href={`mailto:${merchant.email}`}>Email</ActionLink>}
            <ActionLink href={googleMapsSearchUrl(merchant)}>Google Maps</ActionLink>
            {merchant.osmUrl && <ActionLink href={merchant.osmUrl}>OpenStreetMap</ActionLink>}
            <ActionLink href={btcMapMerchantUrl(merchant.id)}>BTC Map</ActionLink>
          </div>

          <dl className="mt-7 grid gap-3 border-t border-border pt-5 text-sm sm:grid-cols-2">
            {merchant.openingHours && (
              <Info label="Horarios" value={merchant.openingHours} />
            )}
            {verifiedDate && <Info label="Última verificación" value={verifiedDate} />}
            {merchant.paymentProvider && (
              <Info label="Proveedor de pago" value={merchant.paymentProvider} />
            )}
            {merchant.requiredAppUrl && (
              <div>
                <dt className="text-xs text-muted">Aplicación requerida</dt>
                <dd className="mt-1">
                  <a
                    href={merchant.requiredAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    Abrir aplicación
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </header>

      <GooglePlaceDetails merchantId={merchant.id} />

      <p className="mt-6 text-center text-xs text-muted">
        Información comercial aportada por la comunidad de{" "}
        <a href="https://btcmap.org" target="_blank" rel="noreferrer" className="hover:text-fg">
          BTC Map
        </a>
        . Confirmá la aceptación de Bitcoin antes de visitar.
      </p>
    </article>
  );
}

function PaymentChip({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={
        active
          ? "rounded-full bg-up/15 px-3 py-1.5 text-xs font-medium text-up"
          : "rounded-full bg-surface-2 px-3 py-1.5 text-xs text-muted line-through opacity-60"
      }
    >
      {children}
    </span>
  );
}

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="glass-pill relative z-10 rounded-lg border px-3 py-2 text-sm font-medium text-fg transition-colors hover:border-bitcoin/50 hover:text-bitcoin"
    >
      {children}
    </a>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-fg">{value}</dd>
    </div>
  );
}
