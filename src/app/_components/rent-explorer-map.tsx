"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import { useMemo, useState } from "react";
import Map, { Marker, NavigationControl, Popup } from "react-map-gl/mapbox";
import type { LngLatBounds } from "mapbox-gl";

export type ExplorerMapBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type ExplorerMapMarker = {
  latitude: number;
  longitude: number;
  propertyId: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string | null;
  reviewCount: number;
  medianRent: number | null;
};

type RentExplorerMapProps = {
  markers: ExplorerMapMarker[];
  selectedPropertyId: string | null;
  isLoading: boolean;
  onMarkerClick: (propertyId: string) => void;
  onBoundsChange: (bounds: ExplorerMapBounds) => void;
};

/** Aligns with Tailwind `sm:` (640px): phones get a slightly wider default view. */
const INITIAL_CENTER = { longitude: -71.0589, latitude: 42.3601 };
const INITIAL_ZOOM_DESKTOP = 11.2;
const INITIAL_ZOOM_PHONE = 10.55;

function toBounds(mapBounds: LngLatBounds): ExplorerMapBounds {
  const southWest = mapBounds.getSouthWest();
  const northEast = mapBounds.getNorthEast();
  return {
    minLat: southWest.lat,
    maxLat: northEast.lat,
    minLng: southWest.lng,
    maxLng: northEast.lng,
  };
}

function markerSize(reviewCount: number): number {
  if (reviewCount >= 20) return 40;
  if (reviewCount >= 10) return 34;
  if (reviewCount >= 5) return 30;
  return 26;
}

export function RentExplorerMap({
  markers,
  selectedPropertyId,
  isLoading,
  onMarkerClick,
  onBoundsChange,
}: RentExplorerMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  const hasToken = token.trim().length > 0;
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);

  const initialViewState = useMemo(() => {
    const phone =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 639px)").matches;
    return {
      ...INITIAL_CENTER,
      zoom: phone ? INITIAL_ZOOM_PHONE : INITIAL_ZOOM_DESKTOP,
    };
  }, []);

  const sortedMarkers = useMemo(
    () => [...markers].sort((a, b) => a.reviewCount - b.reviewCount),
    [markers],
  );
  const activeMarker = useMemo(() => {
    const activePropertyId = selectedPropertyId ?? hoveredPropertyId;
    if (!activePropertyId) return null;
    return sortedMarkers.find((marker) => marker.propertyId === activePropertyId) ?? null;
  }, [hoveredPropertyId, selectedPropertyId, sortedMarkers]);

  if (!hasToken) {
    return (
      <div className="bg-amber-50 p-4 text-[1.04rem] text-amber-900 sm:rounded-3xl sm:border sm:border-amber-200">
        Set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to enable the map.
      </div>
    );
  }

  return (
    <div className="relative overflow-visible bg-white ring-1 ring-muted-blue/20 sm:rounded-3xl sm:border sm:border-muted-blue/25 sm:shadow-[0_10px_36px_-14px_rgb(21_42_69/0.28)]">
      {/* Slightly richer basemap while keeping the light style: bump saturation/contrast on the canvas only */}
      <div
        className="[&_.mapboxgl-canvas-container]:overflow-hidden [&_.mapboxgl-canvas-container]:rounded-3xl [&_.mapboxgl-map]:rounded-3xl [&_.mapboxgl-canvas]:saturate-[1.22] [&_.mapboxgl-canvas]:contrast-[1.09] [&_.mapboxgl-canvas]:brightness-[1.02]"
      >
        <Map
        initialViewState={initialViewState}
        style={{ width: "100%", height: 420 }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={token}
        onLoad={(event) => {
          const bounds = event.target.getBounds();
          if (bounds) onBoundsChange(toBounds(bounds));
        }}
        onMoveEnd={(event) => {
          const bounds = event.target.getBounds();
          if (bounds) onBoundsChange(toBounds(bounds));
        }}
        onClick={() => onMarkerClick("")}
        maxBounds={[
          [-71.25, 42.22],
          [-70.92, 42.43],
        ]}
      >
        <NavigationControl position="top-right" />
        {sortedMarkers.map((marker) => {
          const selected = marker.propertyId === selectedPropertyId;
          const size = markerSize(marker.reviewCount);
          return (
            <Marker
              key={`${marker.propertyId}:${marker.latitude}:${marker.longitude}`}
              longitude={marker.longitude}
              latitude={marker.latitude}
              anchor="center"
              onClick={(event) => {
                event.originalEvent.stopPropagation();
                onMarkerClick(marker.propertyId);
              }}
            >
              <button
                type="button"
                onMouseEnter={() => setHoveredPropertyId(marker.propertyId)}
                onMouseLeave={() => setHoveredPropertyId(null)}
                className={`grid place-items-center rounded-full border text-xs font-semibold transition ${
                  selected
                    ? "border-white bg-muted-blue-hover text-white shadow-[0_4px_14px_-2px_rgb(21_42_69/0.55)] ring-2 ring-white/90"
                    : "border-white/95 bg-muted-blue text-white shadow-[0_3px_12px_-3px_rgb(21_42_69/0.45)] ring-1 ring-muted-blue/40 hover:bg-muted-blue-hover hover:ring-muted-blue-hover/55"
                }`}
                style={{ width: size, height: size }}
                aria-label={`${marker.addressLine1}, ${marker.reviewCount} review${marker.reviewCount === 1 ? "" : "s"}`}
              >
                {marker.reviewCount}
              </button>
            </Marker>
          );
        })}
        {activeMarker ? (
          <Popup
            longitude={activeMarker.longitude}
            latitude={activeMarker.latitude}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={[0, 12]}
            className="z-30 [&_.mapboxgl-popup]:!max-w-none [&_.mapboxgl-popup-content]:rounded-xl [&_.mapboxgl-popup-content]:border [&_.mapboxgl-popup-content]:border-muted-blue/20 [&_.mapboxgl-popup-content]:p-3 [&_.mapboxgl-popup-content]:shadow-lg [&_.mapboxgl-popup-tip]:border-muted-blue/20"
          >
            <div className="min-w-[14rem] space-y-1.5 text-sm text-zinc-800">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-muted-blue-hover">
                  {activeMarker.addressLine1}
                </p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setHoveredPropertyId(null);
                    onMarkerClick("");
                  }}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-sm leading-none text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                  aria-label="Close map tooltip"
                >
                  ×
                </button>
              </div>
              <p className="text-zinc-700">
                {activeMarker.city}, {activeMarker.state} {activeMarker.postalCode ?? ""}
              </p>
              <p>
                {activeMarker.reviewCount} review
                {activeMarker.reviewCount === 1 ? "" : "s"}
              </p>
              <p>
                Median rent:{" "}
                <span className="font-semibold text-zinc-900">
                  {typeof activeMarker.medianRent === "number"
                    ? `$${activeMarker.medianRent.toLocaleString()}`
                    : "n/a"}
                </span>
              </p>
              <Link
                href={`/properties/${activeMarker.propertyId}`}
                className="inline-block text-[13px] font-semibold text-muted-blue hover:text-muted-blue-hover hover:underline"
              >
                View Property
              </Link>
            </div>
          </Popup>
        ) : null}
      </Map>
      </div>
      {isLoading ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-muted-blue-tint/95 to-white/90 px-3 py-2 text-center text-sm font-semibold text-muted-blue-hover backdrop-blur-[2px]">
          Updating map…
        </div>
      ) : null}
    </div>
  );
}
