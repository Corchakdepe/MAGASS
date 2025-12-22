import * as React from "react";
import type {DateRange} from "react-day-picker";

import {Button} from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Calendar} from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type FilterOperator = ">=" | "<=" | ">" | "<";

export type MapsFilterControlsProps = {
    useFilterForMaps: boolean;
    setUseFilterForMaps: React.Dispatch<React.SetStateAction<boolean>>;

    filterKind: "EstValor" | "EstValorDias" | "Horas" | "Porcentaje";
    setFilterKind: React.Dispatch<
        React.SetStateAction<"EstValor" | "EstValorDias" | "Horas" | "Porcentaje">
    >;

    filterState: {
        operator: string;
        value: string;
        dayPct: string;
        days: string;
        allowedFailDays: string;
        stationsPct: string;
        stationsList: string;
    };
    setFilterState: React.Dispatch<
        React.SetStateAction<{
            operator: string;
            value: string;
            dayPct: string;
            days: string;
            allowedFailDays: string;
            stationsPct: string;
            stationsList: string;
        }>
    >;

    daysRange: DateRange | undefined;
    setDaysRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>;

    dateDiffInDays: (to: Date, from: Date) => number;
};

export function MapsAndGraphsFilterControls({
                                                useFilterForMaps,
                                                setUseFilterForMaps,
                                                filterKind,
                                                setFilterKind,
                                                filterState,
                                                setFilterState,
                                                daysRange,
                                                setDaysRange,
                                                dateDiffInDays,
                                            }: MapsFilterControlsProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Checkbox
                    id="use-filter-maps"
                    checked={useFilterForMaps}
                    onCheckedChange={(v) => setUseFilterForMaps(Boolean(v))}
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
                <Label
                    htmlFor="use-filter-maps"
                    className="cursor-pointer text-xs text-brand-700"
                >
                    Habilitar filtrado
                </Label>
            </div>

            {useFilterForMaps && (
                <Card className="border border-brand-100 bg-brand-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-brand-700">
                            Filtrado de estaciones
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Restringe los resultados por valor y rango de dÃ­as.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-brand-700">Tipo de filtro</Label>
                            <select
                                className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring"
                                value={filterKind}
                                onChange={(e) => setFilterKind(e.target.value as any)}
                            >
                                <option value="EstValor">EstaciÃ³n valor (dÃ­a)</option>
                                <option value="EstValorDias">EstaciÃ³n valor (mes)</option>
                                <option value="Horas">Horas</option>
                                <option value="Porcentaje">Porcentaje</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs text-brand-700">Operador</Label>
                                <Select
                                    value={filterState.operator}
                                    onValueChange={(operator) =>
                                        setFilterState((s) => ({...s, operator}))
                                    }
                                >
                                    <SelectTrigger className="h-8 w-full text-xs border-input bg-background">
                                        <SelectValue placeholder="â‰¥ / â‰¤ / > / <"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {([">=", "<=", ">", "<"] as FilterOperator[]).map((op) => (
                                            <SelectItem key={op} value={op}>
                                                {op}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs text-brand-700">Valor</Label>
                                <Input
                                    className="h-8 w-full text-xs border-input bg-background"
                                    value={filterState.value}
                                    onChange={(e) =>
                                        setFilterState((s) => ({...s, value: e.target.value}))
                                    }
                                    placeholder="65"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="dayPct" className="text-xs text-brand-700">
                                % del dÃ­a
                            </Label>
                            <div className="flex items-center gap-3">
                                <input
                                    id="dayPct"
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={Number(filterState.dayPct || 0)}
                                    onChange={(e) =>
                                        setFilterState((s) => ({...s, dayPct: e.target.value}))
                                    }
                                    className="flex-1 accent-brand-500"
                                />
                                <span className="w-12 text-right text-xs">
                  {filterState.dayPct || 0}%
                </span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-brand-700">DÃ­as</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-8 w-full justify-between px-2 text-xs border-input bg-background"
                                    >
                                        {!daysRange?.from || !daysRange?.to
                                            ? "Todos los dÃ­as"
                                            : `${daysRange.from.toLocaleDateString()} - ${daysRange.to.toLocaleDateString()}`}
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-auto p-2">
                                    <Calendar
                                        mode="range"
                                        selected={daysRange}
                                        onSelect={(range) => {
                                            setDaysRange(range);

                                            if (!range?.from || !range?.to) {
                                                setFilterState((s) => ({...s, days: "all"}));
                                                return;
                                            }

                                            const toIdx = dateDiffInDays(range.to, range.from);
                                            const daysStr = Array.from(
                                                {length: toIdx + 1},
                                                (_, i) => String(i),
                                            ).join(";");
                                            setFilterState((s) => ({...s, days: daysStr}));
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-brand-700">DÃ­as excepciÃ³n</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-8 w-full justify-between px-2 text-xs border-input bg-background"
                                    >
                                        {filterState.allowedFailDays
                                            ? `Hasta ${filterState.allowedFailDays} dÃ­as`
                                            : "Sin excepciones"}
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-auto p-2">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] text-brand-700">
                                            NÃºmero mÃ¡ximo de dÃ­as con fallo
                                        </Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            className="h-8 w-full text-xs border-input bg-background"
                                            value={filterState.allowedFailDays}
                                            onChange={(e) =>
                                                setFilterState((s) => ({
                                                    ...s,
                                                    allowedFailDays: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}