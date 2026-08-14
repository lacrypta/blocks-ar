"use client";

import { useQuery } from "@tanstack/react-query";
import type { GooglePlaceEnrichment } from "@/lib/merchants/model";

async function fetchGooglePlace(id: number): Promise<GooglePlaceEnrichment | null> {
  const response = await fetch(`/api/comercios/${id}/google`, { cache: "no-store" });
  if (response.status === 204 || response.status === 404) return null;
  if (!response.ok) throw new Error("Google Places no disponible");
  return response.json();
}

export function GooglePlaceDetails({ merchantId }: { merchantId: number }) {
  const { data } = useQuery({
    queryKey: ["merchant-google", merchantId],
    queryFn: () => fetchGooglePlace(merchantId),
    staleTime: 0,
    retry: 1,
  });
  if (!data) return null;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-surface/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted">Valoración</div>
          <a
            href={data.googleMapsUri}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-2 hover:underline"
          >
            {data.rating !== undefined && (
              <>
                <span className="text-xl font-bold">{data.rating.toFixed(1)}</span>
                <span className="text-gold" aria-label={`${data.rating} de 5 estrellas`}>
                  ★
                </span>
                <span className="text-sm text-muted">
                  ({data.userRatingCount?.toLocaleString("es-AR") ?? 0})
                </span>
              </>
            )}
          </a>
        </div>
        <a
          href={data.googleMapsUri}
          target="_blank"
          rel="noreferrer"
          aria-label="Google Maps"
          className="inline-flex p-2.5 pb-1.5"
        >
          {/* Official Google Maps attribution assets, shown unmodified. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/google-maps-logo-dark-gray.png"
            alt="Google Maps"
            className="h-4 w-auto dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/google-maps-logo-white.png"
            alt="Google Maps"
            className="hidden h-4 w-auto dark:block"
          />
        </a>
      </div>

      {data.photos.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {data.photos.map((photo, index) => (
            <figure
              key={`${photo.photoUri}-${index}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-2"
            >
              <a
                href={photo.googleMapsUri ?? data.googleMapsUri}
                target="_blank"
                rel="noreferrer"
                aria-label={`Ver foto ${index + 1} en Google Maps`}
              >
                {/* Temporary Google Places URLs cannot be handled by next/image. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.photoUri}
                  alt={`Foto ${index + 1} del comercio`}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </a>
              {photo.authors.length > 0 && (
                <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1 bg-black/70 px-2 py-1 text-[10px] text-white">
                  {photo.authors.map((author) => (
                    <a
                      key={`${author.displayName}-${author.uri}`}
                      href={author.uri ?? author.photoUri ?? photo.googleMapsUri ?? data.googleMapsUri}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      {author.photoUri && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={author.photoUri}
                          alt=""
                          className="h-4 w-4 rounded-full object-cover"
                        />
                      )}
                      {author.displayName}
                    </a>
                  ))}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-muted">
        La valoración y las imágenes son contenido de Google Maps. Google no verifica
        las reseñas, pero revisa y elimina el contenido falso cuando lo identifica.{" "}
        <a
          href="https://support.google.com/contributionpolicy/answer/7400114"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-fg"
        >
          Más información
        </a>
        .
      </p>
    </section>
  );
}
