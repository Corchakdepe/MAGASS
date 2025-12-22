"use client";

import * as React from "react";
import type {DateRange} from "react-day-picker";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem} from "@/components/ui/command";
import {Badge} from "@/components/ui/badge";

import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Calendar} from "@/components/ui/calendar";
import {Checkbox} from "@/components/ui/checkbox";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { GraphsSelectorCardProps } from "@/lib/analysis/graphs/types"

//Solo sirve para enseñar todos los dias si se selecciona
function RangeLabel({range}: { range: DateRange | undefined }) {
    if (!range?.from || !range?.to) return "Todos los días";
    return `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`;
}

export function GraphsSelectorCard(props: GraphsSelectorCardProps) {
    const {
        GRAFICAS,
        selectedCharts,
        setSelectedCharts,
        useFilter,
        barStations,
        setBarStations,
        barDaysRange,
        setBarDaysRange,
        barDays,
        setBarDays,
        dayDaysRange,
        setDayDaysRange,
        dayDays,
        setDayDays,
        dayMode,
        setDayMode,
        dayFreq,
        setDayFreq,
        lineStations,
        setLineStations,
        lineDaysRange,
        setLineDaysRange,
        lineDays,
        setLineDays,
        matsDelta,
        setMatsDelta,
        matsMode,
        setMatsMode,
        matsStations1,
        setMatsStations1,
        matsStations2,
        setMatsStations2,
        encodeRangeAsDayList,
    } = props;

    return (
        <div
            className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-3 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-xs font-semibold text-text-primary">Gráficas</div>
                    <div className="text-[11px] text-text-secondary">
                        Selecciona gráficas y ajusta parámetros por gráfica.
                    </div>
                </div>

                {useFilter ? (
                    <div className="shrink-0 rounded-md bg-accent-soft px-2 py-1 text-[11px] text-accent">
                        Filtro activo
                    </div>
                ) : null}
            </div>

            {/* Multi-select: trigger + selected chips */}
            <div className="space-y-2">
                <Label className="text-[11px] text-text-secondary">Selección</Label>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={[
                                "h-9 w-full justify-between px-2 text-xs",
                                "bg-surface-1 border border-surface-3",
                                "hover:bg-surface-0",
                                "focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30",
                            ].join(" ")}
                        >
            <span className="truncate text-left">
              {selectedCharts.length === 0
                  ? "Selecciona gráficas…"
                  : `${selectedCharts.length} seleccionadas`}
            </span>
                            <span className="ml-2 text-text-tertiary">▾</span>
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent
                        className="w-[340px] max-w-[90vw] p-2 bg-surface-1 border border-surface-3 shadow-mac-panel">
                        <Command>
                            <CommandInput placeholder="Buscar gráfica…" className="text-xs"/>
                            <CommandEmpty>No hay resultados.</CommandEmpty>

                            <CommandGroup>
                                {GRAFICAS.map((g) => {
                                    const checked = selectedCharts.includes(g.key);
                                    return (
                                        <CommandItem
                                            key={g.key}
                                            value={g.label}
                                            onSelect={() => {
                                                if (checked) setSelectedCharts(selectedCharts.filter((k) => k !== g.key));
                                                else setSelectedCharts([...selectedCharts, g.key]);
                                            }}
                                            className="text-xs"
                                        >
                                            <div className="mr-2">
                                                <Checkbox checked={checked}/>
                                            </div>
                                            <span className="truncate">{g.label}</span>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </Command>
                    </PopoverContent>
                </Popover>

                {selectedCharts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {GRAFICAS.filter((g) => selectedCharts.includes(g.key)).map((g) => (
                            <Badge
                                key={g.key}
                                variant="secondary"
                                className="bg-surface-0 text-text-primary border border-surface-3"
                            >
                                {g.label}
                            </Badge>
                        ))}
                    </div>
                ) : null}
            </div>

            {/* Editors for each selected graph */}
            <div className="space-y-3">
                {GRAFICAS.map((g) => {
                    if (!selectedCharts.includes(g.key)) return null;

                    return (
                        <section key={g.key} className="rounded-lg border border-surface-3 bg-surface-0/70 p-3">
                            <div className="text-xs font-semibold text-text-primary">{g.label}</div>

                            {/* barras est */}
                            {(g.key === "graf_barras_est_med" || g.key === "graf_barras_est_acum") && (
                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-text-secondary">Estaciones</Label>
                                        <Input
                                            className="h-8 text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                                            placeholder="87;212"
                                            value={barStations}
                                            onChange={(e) => setBarStations(e.target.value)}
                                            disabled={useFilter}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-text-secondary">Días</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="h-8 w-full justify-between px-2 text-xs bg-surface-1 border border-surface-3 hover:bg-surface-0 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                                                >
                                                    <span className="truncate"><RangeLabel range={barDaysRange}/></span>
                                                    <span className="ml-2 text-text-tertiary">▾</span>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-2 bg-surface-1 border border-surface-3 shadow-mac-panel">
                                                <Calendar
                                                    mode="range"
                                                    selected={barDaysRange}
                                                    onSelect={(range) => {
                                                        setBarDaysRange(range);
                                                        setBarDays(encodeRangeAsDayList(range));
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        <div className="text-[10px] text-text-tertiary">
                                            Valor enviado: <code className="font-mono">{barDays}</code>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* barras dia */}
                            {g.key === "graf_barras_dia" && (
                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-text-secondary">Días</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="h-8 w-full justify-between px-2 text-xs bg-surface-1 border border-surface-3 hover:bg-surface-0 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                                                >
                                                    <span className="truncate"><RangeLabel range={dayDaysRange}/></span>
                                                    <span className="ml-2 text-text-tertiary">▾</span>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-2 bg-surface-1 border border-surface-3 shadow-mac-panel">
                                                <Calendar
                                                    mode="range"
                                                    selected={dayDaysRange}
                                                    onSelect={(range) => {
                                                        setDayDaysRange(range);
                                                        setDayDays(encodeRangeAsDayList(range));
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        <div className="text-[10px] text-text-tertiary">
                                            Valor enviado: <code className="font-mono">{dayDays}</code>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label className="text-[11px] text-text-secondary">Modo</Label>
                                            <Select value={dayMode} onValueChange={(v) => setDayMode(v as "M" | "A")}>
                                                <SelectTrigger
                                                    className="h-8 text-xs bg-surface-1 border border-surface-3 focus:ring-2 focus:ring-accent/25 focus:border-accent/30">
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent
                                                    className="bg-surface-1 border border-surface-3 shadow-mac-panel">
                                                    <SelectItem value="M">Media (M)</SelectItem>
                                                    <SelectItem value="A">Acum. (A)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center gap-2 pt-1">
                                            <Checkbox checked={dayFreq}
                                                      onCheckedChange={(v) => setDayFreq(Boolean(v))}/>
                                            <span className="text-[11px] text-text-secondary">Frecuencia (-Frec)</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* linea comp est */}
                            {g.key === "graf_linea_comp_est" && (
                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-text-secondary">Estaciones</Label>
                                        <Input
                                            className="h-8 text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                                            placeholder="87;212"
                                            value={lineStations}
                                            onChange={(e) => setLineStations(e.target.value)}
                                            disabled={useFilter}
                                        />
                                        <div className="text-[10px] text-text-tertiary">
                                            Usa "all" o patrones por estación separados por "#" (ej: 0;1#2;3).
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-text-secondary">Días</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="h-8 w-full justify-between px-2 text-xs bg-surface-1 border border-surface-3 hover:bg-surface-0 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                                                >
                                                    <span className="truncate"><RangeLabel
                                                        range={lineDaysRange}/></span>
                                                    <span className="ml-2 text-text-tertiary">▾</span>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-2 bg-surface-1 border border-surface-3 shadow-mac-panel">
                                                <Calendar
                                                    mode="range"
                                                    selected={lineDaysRange}
                                                    onSelect={(range) => {
                                                        setLineDaysRange(range);
                                                        setLineDays(encodeRangeAsDayList(range));
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        <div className="text-[10px] text-text-tertiary">
                                            Valor enviado: <code className="font-mono">{lineDays}</code>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* linea comp mats */}
                            {g.key === "graf_linea_comp_mats" && (
                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-text-secondary">Δ y modo</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                className="h-8 text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                                                placeholder="Δ"
                                                value={matsDelta}
                                                onChange={(e) => setMatsDelta(e.target.value)}
                                            />
                                            <Select value={matsMode} onValueChange={(v) => setMatsMode(v as "M" | "A")}>
                                                <SelectTrigger
                                                    className="h-8 text-xs bg-surface-1 border border-surface-3 focus:ring-2 focus:ring-accent/25 focus:border-accent/30">
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent
                                                    className="bg-surface-1 border border-surface-3 shadow-mac-panel">
                                                    <SelectItem value="M">Media</SelectItem>
                                                    <SelectItem value="A">Acum.</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-text-secondary">Estaciones</Label>
                                        <Input
                                            className="h-8 text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                                            placeholder="Est. matriz base (ej: 87;212)"
                                            value={matsStations1}
                                            onChange={(e) => setMatsStations1(e.target.value)}
                                            disabled={useFilter}
                                        />
                                        <Input
                                            className="mt-2 h-8 text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                                            placeholder="Est. matriz custom (ej: 0;1)"
                                            value={matsStations2}
                                            onChange={(e) => setMatsStations2(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>
        </div>
    );


}