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
      <div className="flex items-center gap-2">
        <Checkbox
          id="advanced-user"
          checked={advancedUser}
          onCheckedChange={(v) => setAdvancedUser(Boolean(v))}
        />
        <Label htmlFor="advanced-user" className="text-xs">
          Advanced user
        </Label>
      </div>

      {advancedUser && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Delta</Label>
            <Select
              value={deltaMode}
              onValueChange={(v) => setDeltaMode(v as DeltaMode)}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue placeholder="Selecciona delta..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="media">Delta Media</SelectItem>
                <SelectItem value="acumulada">Delta Acumulada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Valor</Label>
            <Input
              className="h-8 text-xs w-full"
              value={deltaValueTxt}
              onChange={(e) => setDeltaValueTxt(e.target.value)}
              placeholder="4, 60, 1440…"
            />
          </div>
        </div>
      )}

      {advancedUser && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="h-8 text-xs">Advanced input</Label>
            <Input
              value={advancedEntrada}
              onChange={(e) => setAdvancedEntrada(e.target.value)}
              placeholder="..."
            />
          </div>

          <div className="space-y-1">
            <Label className="h-8 text-xs">Advanced output</Label>
            <Input
              value={advancedSalida}
              onChange={(e) => setAdvancedSalida(e.target.value)}
              placeholder="..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
