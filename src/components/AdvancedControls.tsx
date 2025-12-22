import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DeltaMode = "media" | "acumulada";

export type AdvancedControlsProps = {
  advancedUser: boolean;
  setAdvancedUser: React.Dispatch<React.SetStateAction<boolean>>;

  deltaMode: DeltaMode;
  setDeltaMode: React.Dispatch<React.SetStateAction<DeltaMode>>;

  deltaValueTxt: string;
  setDeltaValueTxt: React.Dispatch<React.SetStateAction<string>>;

  advancedEntrada: string;
  setAdvancedEntrada: React.Dispatch<React.SetStateAction<string>>;

  advancedSalida: string;
  setAdvancedSalida: React.Dispatch<React.SetStateAction<string>>;
};

export function AdvancedControls({
  advancedUser,
  setAdvancedUser,
  deltaMode,
  setDeltaMode,
  deltaValueTxt,
  setDeltaValueTxt,
  advancedEntrada,
  setAdvancedEntrada,
  advancedSalida,
  setAdvancedSalida,
}: AdvancedControlsProps) {
  return (
    <div className="space-y-4">
      {/* Single grouped surface (avoid cards-in-cards) */}
      <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-4">
        {/* Toggle row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Checkbox
              id="advanced-user"
              checked={advancedUser}
              onCheckedChange={(v) => setAdvancedUser(Boolean(v))}
              className="
                border-surface-3
                data-[state=checked]:border-accent
                data-[state=checked]:bg-accent
                data-[state=checked]:text-text-inverted
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-accent/30
                focus-visible:ring-offset-2
                focus-visible:ring-offset-surface-0
              "
            />
            <Label
              htmlFor="advanced-user"
              className="text-xs text-text-primary select-none"
            >
              Advanced user
            </Label>
          </div>

          <span className="text-[11px] text-text-secondary">
            Ajustes avanzados
          </span>
        </div>

        {advancedUser && (
          <div className="mt-4 space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-medium text-text-secondary">
                  Delta
                </Label>
                <Select
                  value={deltaMode}
                  onValueChange={(v) => setDeltaMode(v as DeltaMode)}
                >
                  <SelectTrigger className="h-9 text-xs w-full rounded-md border-surface-3 bg-surface-1 focus:ring-2 focus:ring-accent/20 focus:border-accent">
                    <SelectValue placeholder="Selecciona delta..." />
                  </SelectTrigger>
                  <SelectContent className="border-surface-3 bg-surface-1/95 backdrop-blur-md">
                    <SelectItem value="media">Delta Media</SelectItem>
                    <SelectItem value="acumulada">Delta Acumulada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-medium text-text-secondary">
                  Valor
                </Label>
                <Input
                  className="h-9 text-xs w-full rounded-md border-surface-3 bg-surface-1 focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:border-accent"
                  value={deltaValueTxt}
                  onChange={(e) => setDeltaValueTxt(e.target.value)}
                  placeholder="4, 60, 1440…"
                />
              </div>
            </div>

            {/* Divider (subtle, macOS-like) */}
            <div className="h-px bg-surface-3/70" />

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-medium text-text-secondary">
                  Advanced input
                </Label>
                <Input
                  className="h-9 text-xs w-full rounded-md border-surface-3 bg-surface-1 focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:border-accent"
                  value={advancedEntrada}
                  onChange={(e) => setAdvancedEntrada(e.target.value)}
                  placeholder="..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-medium text-text-secondary">
                  Advanced output
                </Label>
                <Input
                  className="h-9 text-xs w-full rounded-md border-surface-3 bg-surface-1 focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:border-accent"
                  value={advancedSalida}
                  onChange={(e) => setAdvancedSalida(e.target.value)}
                  placeholder="..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
