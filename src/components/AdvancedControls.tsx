import * as React from "react";

import {Checkbox} from "@/components/ui/checkbox";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
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
        <div className="space-y-4 bg-brand-50/60 rounded-xl p-4">
            <div className="flex items-center gap-2 bg-border-50">
                <Checkbox
                    id="advanced-user"
                    checked={advancedUser}
                    onCheckedChange={(v) => setAdvancedUser(Boolean(v))}
                    className="
    border-brand-100
    data-[state=checked]:border-brand-500
    data-[state=checked]:bg-brand-500
    data-[state=checked]:text-brand-50
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-brand-400
    focus-visible:ring-offset-2
    focus-visible:ring-offset-background
  "
                />
                <Label htmlFor="advanced-user" className="  text-xs text-brand-700">
                    Advanced user
                </Label>
            </div>

            {advancedUser && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-brand-700">Delta</Label>
                        <Select
                            value={deltaMode}
                            onValueChange={(v) => setDeltaMode(v as DeltaMode)}
                        >
                            <SelectTrigger
                                className="h-8 text-xs w-full border-brand-100 focus:ring-brand-300 focus:border-brand-300">
                                <SelectValue placeholder="Selecciona delta..."/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="media">Delta Media</SelectItem>
                                <SelectItem value="acumulada">Delta Acumulada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-brand-700">Valor</Label>
                        <Input
                            className="h-8 text-xs w-full border-brand-100 focus-visible:ring-brand-300 focus-visible:border-brand-300"
                            value={deltaValueTxt}
                            onChange={(e) => setDeltaValueTxt(e.target.value)}
                            placeholder="4, 60, 1440â€¦"
                        />
                    </div>
                </div>
            )}

            {advancedUser && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="h-8 text-xs text-brand-700">
                            Advanced input
                        </Label>
                        <Input
                            className="border-brand-100 focus-visible:ring-brand-300 focus-visible:border-brand-300"
                            value={advancedEntrada}
                            onChange={(e) => setAdvancedEntrada(e.target.value)}
                            placeholder="..."
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="h-8 text-xs text-brand-700">
                            Advanced output
                        </Label>
                        <Input
                            className="border-brand-100 focus-visible:ring-brand-300 focus-visible:border-brand-300"
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
