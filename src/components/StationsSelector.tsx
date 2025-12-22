"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MapKey =
  | "mapa_densidad"
  | "mapa_circulo"
  | "mapa_voronoi"
  | "mapa_desplazamientos";

export type StationsSelectorProps = {
  mapKey: MapKey;
  value: string;
  disabled?: boolean;
  onChange: (mapKey: MapKey, next: string) => void;
  onClear?: () => void;
};

export function StationsSelector({
  mapKey,
  value,
  disabled = false,
  onChange,
  onClear,
}: StationsSelectorProps) {
  const label =
    mapKey === "mapa_densidad"
      ? "Estaciones (densidad)"
      : mapKey === "mapa_circulo"
      ? "Estaciones (círculo)"
      : "Estaciones";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-brand-700">{label}</Label>
        {value && onClear && (
          <button
            type="button"
            className="text-[10px] text-muted-foreground hover:underline"
            onClick={() => onClear()}
          >
            Limpiar
          </button>
        )}
      </div>

      <Input
        className="h-7 w-full text-xs border-input bg-background focus-visible:border-ring focus-visible:ring-ring"
        placeholder="0;1;2;3;..."
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(mapKey, e.target.value)}
      />

      <p className="text-[10px] text-muted-foreground">
        Lista de IDs de estaciones separadas por “;”.
      </p>
    </div>
  );
}
