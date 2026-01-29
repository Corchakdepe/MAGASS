"use client";

import { Map, MapMarker, MarkerContent, useMap } from "@/components/ui/map";
import { useEffect } from "react";
import type { GeoJSONSource } from "maplibre-gl";

interface Route {
  id: string;
  originStation: number;
  destStation: number;
  coordinates: Array<[number, number]>;
  type: "cycling" | "walking";
  weight: number;
}

interface RoutesMapProps {
  routes: Route[];
  stations: Map<number, { lat: number; lng: number }>;
  center: { lat: number; lng: number };
}

export function RoutesMap({ routes, stations, center }: RoutesMapProps) {
  return (
    <div className="w-full h-full">
      <Map
        styles={{
          light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
          dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        }}
      >
        <RouteContent routes={routes} stations={stations} center={center} />
      </Map>
    </div>
  );
}

function RouteContent({ routes, stations, center }: RoutesMapProps) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    map.flyTo({
      center: [center.lng, center.lat],
      zoom: 12,
      duration: 1000,
    });

    // Create GeoJSON for all routes
    const routeFeatures = routes.map((route) => ({
      type: "Feature" as const,
      properties: {
        id: route.id,
        type: route.type,
        weight: route.weight,
        color: route.type === "cycling" ? "#ef4444" : "#3b82f6",
      },
      geometry: {
        type: "LineString" as const,
        coordinates: route.coordinates,
      },
    }));

    const geojson = {
      type: "FeatureCollection" as const,
      features: routeFeatures,
    };

    // Add source
    if (!map.getSource("routes-source")) {
      map.addSource("routes-source", {
        type: "geojson",
        data: geojson,
      });
    } else {
      const source = map.getSource("routes-source") as GeoJSONSource;
      source.setData(geojson);
    }

    // Add route lines
    if (!map.getLayer("routes-layer")) {
      map.addLayer({
        id: "routes-layer",
        type: "line",
        source: "routes-source",
        paint: {
          "line-color": ["get", "color"],
          "line-width": [
            "interpolate",
            ["linear"],
            ["get", "weight"],
            0, 2,
            1, 10
          ],
          "line-opacity": 0.7,
        },
      });
    }

    return () => {
      if (map.getLayer("routes-layer")) map.removeLayer("routes-layer");
      if (map.getSource("routes-source")) map.removeSource("routes-source");
    };
  }, [map, isLoaded, routes, center]);

  return (
    <>
      {/* Render station markers */}
      {Array.from(stations.entries()).map(([stationId, coords]) => {
        const hasRoutes = routes.some(
          (r) => r.originStation === stationId || r.destStation === stationId
        );

        if (!hasRoutes) return null;

        return (
          <MapMarker key={stationId} longitude={coords.lng} latitude={coords.lat}>
            <MarkerContent>
              <div className="w-3 h-3 rounded-full bg-white border-2 border-blue-500 shadow-lg" />
            </MarkerContent>
          </MapMarker>
        );
      })}
    </>
  );
}
