"use client";

import { Map, useMap } from "@/components/ui/map";
import { useEffect } from "react";
import type { GeoJSONSource } from "maplibre-gl";

interface DensityMapProps {
  heatmapData: {
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      geometry: { type: "Point"; coordinates: [number, number] };
      properties: { weight: number; stationId: number };
    }>;
  };
  center: { lat: number; lng: number };
  maxValue: number;
}

export function DensityMap({ heatmapData, center, maxValue }: DensityMapProps) {
  return (
    <div className="w-full h-full">
      <Map
        styles={{
          light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
          dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        }}
      >
        <HeatmapLayer heatmapData={heatmapData} center={center} maxValue={maxValue} />
      </Map>
    </div>
  );
}

function HeatmapLayer({ heatmapData, center, maxValue }: DensityMapProps) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    map.flyTo({
      center: [center.lng, center.lat],
      zoom: 12,
      duration: 1000,
    });

    // Add source
    if (!map.getSource("heatmap-source")) {
      map.addSource("heatmap-source", {
        type: "geojson",
        data: heatmapData,
      });
    } else {
      const source = map.getSource("heatmap-source") as GeoJSONSource;
      source.setData(heatmapData);
    }

    // Add heatmap layer
    if (!map.getLayer("heatmap-layer")) {
      map.addLayer({
        id: "heatmap-layer",
        type: "heatmap",
        source: "heatmap-source",
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "weight"],
            0, 0,
            maxValue, 1
          ],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 3],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(33,102,172,0)",
            0.2, "rgb(103,169,207)",
            0.4, "rgb(209,229,240)",
            0.6, "rgb(253,219,199)",
            0.8, "rgb(239,138,98)",
            1, "rgb(178,24,43)"
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 15, 50],
          "heatmap-opacity": 1,
        },
      });
    }

    return () => {
      if (map.getLayer("heatmap-layer")) {
        map.removeLayer("heatmap-layer");
      }
      if (map.getSource("heatmap-source")) {
        map.removeSource("heatmap-source");
      }
    };
  }, [map, isLoaded, heatmapData, center, maxValue]);

  return null;
}
