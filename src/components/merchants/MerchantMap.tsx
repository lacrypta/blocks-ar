"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import { merchantCategoryInfo, type Merchant } from "@/lib/merchants/model";

maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

const SOURCE = "btcmap-merchants";
const LIGHT_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";

function merchantGeoJson(
  merchants: Merchant[],
): Parameters<GeoJSONSource["setData"]>[0] {
  return {
    type: "FeatureCollection",
    features: merchants.map((merchant) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [merchant.lon, merchant.lat] },
      properties: {
        id: merchant.id,
        name: merchant.name,
        category: merchant.category,
        color: merchantCategoryInfo(merchant.category).color,
      },
    })),
  };
}

function addMerchantLayers(map: MapLibreMap, merchants: Merchant[]) {
  const marker = document.createElement("canvas");
  marker.width = 32;
  marker.height = 32;
  const context = marker.getContext("2d");
  if (context) {
    context.fillStyle = "#fff";
    context.font = "700 22px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("B", 16, 17);
    context.fillRect(13, 3, 2, 5);
    context.fillRect(18, 3, 2, 5);
    context.fillRect(13, 24, 2, 5);
    context.fillRect(18, 24, 2, 5);
    map.addImage("bitcoin-marker", context.getImageData(0, 0, 32, 32));
  }
  map.addSource(SOURCE, {
    type: "geojson",
    data: merchantGeoJson(merchants),
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 48,
  });
  map.addLayer({
    id: "merchant-clusters",
    type: "circle",
    source: SOURCE,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#f7931a",
      "circle-radius": ["step", ["get", "point_count"], 19, 10, 24, 50, 30],
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 2,
    },
  });
  map.addLayer({
    id: "merchant-cluster-count",
    type: "symbol",
    source: SOURCE,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["Noto Sans Regular"],
      "text-size": 12,
    },
    paint: { "text-color": "#fff" },
  });
  map.addLayer({
    id: "merchant-points",
    type: "circle",
    source: SOURCE,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": ["get", "color"],
      "circle-radius": 12,
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 2,
    },
  });
  map.addLayer({
    id: "merchant-bitcoin",
    type: "symbol",
    source: SOURCE,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": "bitcoin-marker",
      "icon-size": 0.55,
      "icon-allow-overlap": true,
    },
  });
}

export function MerchantMap({
  merchants,
  onUnsupported,
}: {
  merchants: Merchant[];
  onUnsupported: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const viewRef = useRef<{ center: [number, number]; zoom: number } | null>(null);
  const dataRef = useRef(merchants);
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    dataRef.current = merchants;
    const source = mapRef.current?.getSource(SOURCE) as GeoJSONSource | undefined;
    source?.setData(merchantGeoJson(merchants));
  }, [merchants]);

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      const saved = viewRef.current;
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: resolvedTheme === "dark" ? DARK_STYLE : LIGHT_STYLE,
        center: saved?.center ?? [-64, -38],
        zoom: saved?.zoom ?? 3,
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution:
            'Datos: <a href="https://btcmap.org" target="_blank" rel="noreferrer">BTC Map</a>',
        }),
      );

      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 14 });
      map.on("load", () => {
        addMerchantLayers(map, dataRef.current);
        if (!saved && dataRef.current.length) {
          const bounds = new maplibregl.LngLatBounds();
          for (const merchant of dataRef.current) bounds.extend([merchant.lon, merchant.lat]);
          map.fitBounds(bounds, { padding: 42, maxZoom: 12, duration: 0 });
        }
      });
      map.on("click", "merchant-clusters", async (event: MapLayerMouseEvent) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: ["merchant-clusters"] })[0];
        const clusterId = Number(feature?.properties?.cluster_id);
        if (!Number.isFinite(clusterId) || feature.geometry.type !== "Point") return;
        const source = map.getSource(SOURCE) as GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        const coordinates = feature.geometry.coordinates as [number, number];
        map.easeTo({ center: coordinates, zoom });
      });
      map.on("click", "merchant-points", (event: MapLayerMouseEvent) => {
        const id = Number(event.features?.[0]?.properties?.id);
        if (Number.isInteger(id)) router.push(`/comercios/${id}`);
      });
      map.on("mousemove", "merchant-points", (event: MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const content = document.createElement("div");
        content.className = "px-1 py-0.5 text-sm font-semibold";
        content.textContent = String(feature.properties?.name ?? "Comercio");
        popup
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setDOMContent(content)
          .addTo(map);
      });
      map.on("mouseleave", "merchant-points", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });

      return () => {
        const center = map.getCenter();
        viewRef.current = { center: [center.lng, center.lat], zoom: map.getZoom() };
        popup.remove();
        map.remove();
        if (mapRef.current === map) mapRef.current = null;
      };
    } catch {
      onUnsupported();
    }
  }, [onUnsupported, resolvedTheme, router]);

  return (
    <div
      ref={containerRef}
      className="h-[65vh] min-h-[32rem] overflow-hidden rounded-2xl border border-border bg-surface shadow-lg"
      role="region"
      aria-label="Mapa de comercios que aceptan Bitcoin en Argentina"
    />
  );
}
