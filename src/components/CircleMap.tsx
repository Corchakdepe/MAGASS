"use client";

import { Map, MapMarker, MarkerContent, MarkerPopup, useMap } from "@/components/ui/map";
import { useEffect } from "react";

interface CircleMapProps {
  mapData: {
    coordinates: Array<{
      lat: number;
      lng: number;
      stationId: number;
      value: number;
    }>;
    maxValue: number;
    minValue: number;
  };
  onStationClick?: (stationId: number) => void;
}

function getColor(value: number, minValue: number, maxValue: number): string {
  if (value < 0) {
    // Green gradient for negative values
    const normalized = Math.abs(value) / Math.abs(minValue);
    const greenIntensity = Math.round(100 + 155 * (1 - normalized));
    return `rgb(0, ${greenIntensity}, 0)`;
  } else {
    // Blue to red gradient for positive values
    const normalized = value / maxValue;
    const red = Math.round(255 * normalized);
    const blue = Math.round(255 * (1 - normalized));
    return `rgb(${red}, 0, ${blue})`;
  }
}

export function CircleMap({ mapData, onStationClick }: CircleMapProps) {
  const center = mapData.coordinates[Math.floor(mapData.coordinates.length / 2)];

  return (
    <div className="w-full h-full">
      <Map
        styles={{
          light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
          dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        }}
      >
        <MapContent center={center} mapData={mapData} onStationClick={onStationClick} />
      </Map>
    </div>
  );
}

function MapContent({ center, mapData, onStationClick }: {
  center: { lat: number; lng: number };
  mapData: CircleMapProps["mapData"];
  onStationClick?: (stationId: number) => void;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    map.flyTo({
      center: [center.lng, center.lat],
      zoom: 13,
      duration: 1000,
    });
  }, [map, isLoaded, center]);

  return (
    <>
      {mapData.coordinates.map((coord) => {
        const color = getColor(coord.value, mapData.minValue, mapData.maxValue);

        return (
          <MapMarker
            key={coord.stationId}
            longitude={coord.lng}
            latitude={coord.lat}
            onClick={() => onStationClick?.(coord.stationId)}
          >
            <MarkerContent>
              <div
                className="rounded-full cursor-pointer transition-all hover:scale-110 border-2 border-white shadow-lg"
                style={{
                  width: 30,
                  height: 30,
                  backgroundColor: color,
                  opacity: 0.7,
                }}
              />
            </MarkerContent>
            <MarkerPopup>
              <div className="p-2">
                <p className="font-semibold">Station {coord.stationId}</p>
                <p className="text-sm text-muted-foreground">
                  Value: {coord.value.toFixed(2)}
                </p>
              </div>
            </MarkerPopup>
          </MapMarker>
        );
      })}
    </>
  );
}
