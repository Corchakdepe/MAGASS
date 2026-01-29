"use client";

import { Map, MapMarker, MarkerContent, useMap } from "@/components/ui/map";
import { useEffect } from "react";
import type { GeoJSONSource } from "maplibre-gl";

interface VoronoiMapProps {
  voronoiData: {
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      geometry: {
        type: "Polygon";
        coordinates: Array<Array<[number, number]>>;
      };
      properties: {
        stationId: number;
        value: number;
      };
    }>;
  };
  stations: Array<{ stationId: number; lat: number; lng: number }>;
  center: { lat: number; lng: number };
  maxValue: number;
}

export function VoronoiMap({ voronoiData, stations, center, maxValue }: VoronoiMapProps) {
  return (
    <div className="w-full h-full">
      <Map
        styles={{
          light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
          dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        }}
      >
        <VoronoiLayer
          voronoiData={voronoiData}
          stations={stations}
          center={center}
          maxValue={maxValue}
        />
      </Map>
    </div>
  );
}

function VoronoiLayer({ voronoiData, stations, center, maxValue }: VoronoiMapProps) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    map.flyTo({
      center: [center.lng, center.lat],
      zoom: 13,
      duration: 1000,
    });

    // Add Voronoi source
    if (!map.getSource("voronoi-source")) {
      map.addSource("voronoi-source", {
        type: "geojson",
        data: voronoiData,
      });
    } else {
      const source = map.getSource("voronoi-source") as GeoJSONSource;
      source.setData(voronoiData);
    }

    // Add fill layer
    if (!map.getLayer("voronoi-fill")) {
      map.addLayer({
        id: "voronoi-fill",
        type: "fill",
        source: "voronoi-source",
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "value"],
            0, "#0000ff",
            maxValue / 2, "#00ff00",
            maxValue, "#ff0000"
          ],
          "fill-opacity": 0.4,
        },
      });
    }

    // Add outline layer
    if (!map.getLayer("voronoi-outline")) {
      map.addLayer({
        id: "voronoi-outline",
        type: "line",
        source: "voronoi-source",
        paint: {
          "line-color": "#000000",
          "line-width": 1,
          "line-opacity": 0.5,
        },
      });
    }

    return () => {
      if (map.getLayer("voronoi-fill")) map.removeLayer("voronoi-fill");
      if (map.getLayer("voronoi-outline")) map.removeLayer("voronoi-outline");
      if (map.getSource("voronoi-source")) map.removeSource("voronoi-source");
    };
  }, [map, isLoaded, voronoiData, maxValue, center]);

  return (
    <>
      {stations.map((station) => (
        <MapMarker
          key={station.stationId}
          longitude={station.lng}
          latitude={station.lat}
        >
          <MarkerContent>
            <div className="w-2 h-2 rounded-full bg-black" />
          </MarkerContent>
        </MapMarker>
      ))}
    </>
  );
}
