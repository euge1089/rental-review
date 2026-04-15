"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
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

const INITIAL_VIEW = {
  longitude: -71.0589,
  latitude: 42.3601,
  zoom: 11.2,
};

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

  const sortedMarkers = useMemo(
    () => [...markers].sort((a, b) => a.reviewCount - b.reviewCount),
    [markers],
  );

  if (!hasToken) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to enable the map.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_8px_30px_-16px_rgb(15_23_42/0.2)]">
      <Map
        initialViewState={INITIAL_VIEW}
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
                className={`grid place-items-center rounded-full border text-[11px] font-semibold shadow-sm transition ${
                  selected
                    ? "border-muted-blue-hover bg-muted-blue-hover text-white"
                    : "border-white bg-muted-blue text-white hover:bg-muted-blue-hover"
                }`}
                style={{ width: size, height: size }}
                aria-label={`${marker.addressLine1}, ${marker.reviewCount} review${marker.reviewCount === 1 ? "" : "s"}`}
              >
                {marker.reviewCount}
              </button>
            </Marker>
          );
        })}
      </Map>
      {isLoading ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-white/85 px-3 py-2 text-center text-xs font-medium text-zinc-600">
          Updating map…
        </div>
      ) : null}
    </div>
  );
}
