"use client";

import * as React from "react";
import type {DateRange} from "react-day-picker";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Calendar} from "@/components/ui/calendar";
import {Checkbox} from "@/components/ui/checkbox";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

export type GraficaKey =
    | "graf_barras_est_med"
    | "graf_barras_est_acum"
    | "graf_barras_dia"
    | "graf_linea_comp_est"
    | "graf_linea_comp_mats";

export type GraficaDef = { label: string; key: GraficaKey };

export type GraphsSelectorCardProps = {
    GRAFICAS: GraficaDef[];

    selectedCharts: GraficaKey[];
    setSelectedCharts: (next: GraficaKey[]) => void;

    useFilter: boolean;

    // barras est
    barStations: string;
    setBarStations: (v: string) => void;
    barDaysRange: DateRange | undefined;
    setBarDaysRange: (r: DateRange | undefined) => void;
    barDays: string;
    setBarDays: (v: string) => void;

    // barras dia
    dayDaysRange: DateRange | undefined;
    setDayDaysRange: (r: DateRange | undefined) => void;
    dayDays: string;
    setDayDays: (v: string) => void;
    dayMode: "M" | "A";
    setDayMode: (v: "M" | "A") => void;
    dayFreq: boolean;
    setDayFreq: (v: boolean) => void;

    // linea comp est
    lineStations: string;
    setLineStations: (v: string) => void;
    lineDaysRange: DateRange | undefined;
    setLineDaysRange: (r: DateRange | undefined) => void;
    lineDays: string;
    setLineDays: (v: string) => void;

    // linea comp mats
    matsDelta: string;
    setMatsDelta: (v: string) => void;
    matsMode: "M" | "A";
    setMatsMode: (v: "M" | "A") => void;
    matsStations1: string;
    setMatsStations1: (v: string) => void;
    matsStations2: string;
    setMatsStations2: (v: string) => void;

    // helpers
    encodeRangeAsDayList: (range?: DateRange) => string;
};

function RangeLabel({range}: { range: DateRange | undefined }) {
    if (!range?.from || !range?.to) return "Todos los dÃ­as";
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
        <div className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/80 p-3">
            <div className="space-y-2">
                <Label className="text-xs text-brand-700">GrÃ¡ficas</Label>

                <Autocomplete
                    multiple
                    size="small"
                    options={GRAFICAS}
                    getOptionLabel={(option) => option.label}
                    value={GRAFICAS.filter((g) => selectedCharts.includes(g.key))}
                    onChange={(_, newValue) =>
                        setSelectedCharts(newValue.map((g) => g.key))
                    }
                    disableCloseOnSelect
                    sx={{
                        width: "100%",
                        "& .MuiInputBase-input": {fontSize: 12},
                        "& .MuiInputLabel-root": {fontSize: 12},
                        "& .MuiOutlinedInput-root": {
                            backgroundColor: "hsl(var(--card))",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "hsl(var(--border))",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "hsl(var(--ring))",
                        },
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            fullWidth
                            label="Selecciona grÃ¡ficas..."
                            variant="outlined"
                        />
                    )}
                />
            </div>

            <div className="mt-2 space-y-2">
                {GRAFICAS.map((g) => {
                    if (!selectedCharts.includes(g.key)) return null;

                    return (
                        <div
                            key={g.key}
                            className=" rounded-md border border-brand-100 bg-card px-2 py-2"
                        >
                            <div className="mb-2 text-xs font-medium text-brand-700 ">
                                {g.label}
                            </div>

                            {(g.key === "graf_barras_est_med" ||
                                g.key === "graf_barras_est_acum") && (
                                <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-brand-700">
                                            Estaciones
                                        </Label>
                                        <Input
                                            className="h-7 w-full text-xs border-brand-100 bg-background focus-visible:border-brand-300 focus-visible:ring-brand-300"
                                            placeholder="87;212"
                                            value={barStations}
                                            onChange={(e) => setBarStations(e.target.value)}
                                            disabled={useFilter}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-brand-700">
                                            DÃ­as
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="h-7 w-full justify-between px-2 text-xs border-brand-100 bg-background hover:bg-brand-50"
                                                >
                                                    <RangeLabel range={barDaysRange}/>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-2">
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
                                    </div>

                                    <div className="md:col-span-2 text-[10px] text-muted-foreground">
                                        Valor enviado:{" "}
                                        <code className="font-mono">{barDays}</code>
                                    </div>
                                </div>
                            )}

                            {g.key === "graf_barras_dia" && (
                                <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-brand-700">
                                            DÃ­as
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="h-7 w-full justify-between px-2 text-xs border-brand-100 bg-background hover:bg-brand-50"
                                                >
                                                    <RangeLabel range={dayDaysRange}/>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-2">
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

                                        <div className="text-[10px] text-muted-foreground">
                                            Valor enviado:{" "}
                                            <code className="font-mono">{dayDays}</code>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="space-y-1">
                                            <Label className="text-[11px] text-brand-700">
                                                Modo
                                            </Label>
                                            <Select
                                                value={dayMode}
                                                onValueChange={(v) => setDayMode(v as "M" | "A")}
                                            >
                                                <SelectTrigger
                                                    className="h-7 w-full text-xs border-brand-100 bg-background focus:ring-brand-300 focus:border-brand-300">
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="M">Media (M)</SelectItem>
                                                    <SelectItem value="A">Acum. (A)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center gap-2 pt-1">
                                            <Checkbox
                                                checked={dayFreq}
                                                onCheckedChange={(v) =>
                                                    setDayFreq(Boolean(v))
                                                }
                                            />
                                            <span className="text-[11px] text-brand-700">
                        Frecuencia (-Frec)
                      </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {g.key === "graf_linea_comp_est" && (
                                <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-brand-700">
                                            Estaciones
                                        </Label>
                                        <Input
                                            className="h-7 w-full text-xs border-brand-100 bg-background focus-visible:border-brand-300 focus-visible:ring-brand-300"
                                            placeholder="87;212"
                                            value={lineStations}
                                            onChange={(e) =>
                                                setLineStations(e.target.value)
                                            }
                                            disabled={useFilter}
                                        />
                                        <div className="text-[10px] text-muted-foreground">
                                            Usa "all" o patrones por estaciÃ³n separados por "#" (ej:
                                            0;1#2;3).
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-brand-700">
                                            DÃ­as
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="h-7 w-full justify-between px-2 text-xs border-brand-100 bg-background hover:bg-brand-50"
                                                >
                                                    <RangeLabel range={lineDaysRange}/>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-2">
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

                                        <div className="text-[10px] text-muted-foreground">
                                            Valor enviado:{" "}
                                            <code className="font-mono">{lineDays}</code>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {g.key === "graf_linea_comp_mats" && (
                                <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-brand-700">
                                            Î” y modo
                                        </Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                className="h-7 w-full text-xs border-brand-100 bg-background focus-visible:border-brand-300 focus-visible:ring-brand-300"
                                                placeholder="Î”"
                                                value={matsDelta}
                                                onChange={(e) =>
                                                    setMatsDelta(e.target.value)
                                                }
                                            />
                                            <Select
                                                value={matsMode}
                                                onValueChange={(v) =>
                                                    setMatsMode(v as "M" | "A")
                                                }
                                            >
                                                <SelectTrigger
                                                    className="h-7 w-full text-xs border-brand-100 bg-background focus:ring-brand-300 focus:border-brand-300">
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="M">Media</SelectItem>
                                                    <SelectItem value="A">Acum.</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-brand-700">
                                            Estaciones
                                        </Label>
                                        <Input
                                            className="h-7 w-full text-xs border-brand-100 bg-background focus-visible:border-brand-300 focus-visible:ring-brand-300"
                                            placeholder="Est. matriz base (ej: 87;212)"
                                            value={matsStations1}
                                            onChange={(e) =>
                                                setMatsStations1(e.target.value)
                                            }
                                            disabled={useFilter}
                                        />
                                        <Input
                                            className="mt-1 h-7 w-full text-xs border-brand-100 bg-background focus-visible:border-brand-300 focus-visible:ring-brand-300"
                                            placeholder="Est. matriz custom (ej: 0;1)"
                                            value={matsStations2}
                                            onChange={(e) =>
                                                setMatsStations2(e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}