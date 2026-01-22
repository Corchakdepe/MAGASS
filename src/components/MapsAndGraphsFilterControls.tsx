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
import {useLanguage} from "@/contexts/LanguageContext";

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
    const {t} = useLanguage();

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Checkbox
                    id="use-filter-maps"
                    checked={useFilterForMaps}
                    onCheckedChange={(v) => setUseFilterForMaps(Boolean(v))}
                    className={[
                        "border-surface-3",
                        "data-[state=checked]:border-accent/40",
                        "data-[state=checked]:bg-accent",
                        "data-[state=checked]:text-text-inverted",
                        "focus-visible:outline-none",
                        "focus-visible:ring-2 focus-visible:ring-accent/25",
                        "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
                    ].join(" ")}
                />

                <Label
                    htmlFor="use-filter-maps"
                    className="cursor-pointer text-xs text-text-secondary"
                >
                    {t('enableFiltering')}
                </Label>
            </div>

            {useFilterForMaps && (
                <div
                    className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-3">
                    <div className="mb-3">
                        <div className="text-xs font-semibold text-text-primary">
                            {t('stationFiltering')}
                        </div>
                        <div className="text-[11px] text-text-secondary">
                            {t('restrictResultsByValueAndRange')}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* Tipo de filtro */}
                        <div className="space-y-1">
                            <Label className="text-[11px] text-text-secondary">{t('filterType')}</Label>
                            <select
                                className={[
                                    "h-8 w-full rounded-md px-2 text-xs",
                                    "bg-surface-1 border border-surface-3",
                                    "text-text-primary",
                                    "focus-visible:outline-none",
                                    "focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30",
                                ].join(" ")}
                                value={filterKind}
                                onChange={(e) => setFilterKind(e.target.value as any)}
                            >
                                <option value="EstValor">{t('stationValueDay')}</option>
                                <option value="EstValorDias">{t('stationValueMonth')}</option>
                                <option value="Horas">{t('hours')}</option>
                                <option value="Porcentaje">{t('percentage')}</option>
                            </select>
                        </div>

                        {/* Operador + valor */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[11px] text-text-secondary">{t('operator')}</Label>
                                <Select
                                    value={filterState.operator}
                                    onValueChange={(operator) => setFilterState((s) => ({...s, operator}))}
                                >
                                    <SelectTrigger
                                        className="h-8 w-full text-xs bg-surface-1 border border-surface-3 focus:ring-2 focus:ring-accent/25 focus:border-accent/30">
                                        <SelectValue placeholder="≥ / ≤ / > / <"/>
                                    </SelectTrigger>
                                    <SelectContent className="bg-surface-1 border border-surface-3 shadow-mac-panel">
                                        {([">=", "<=", ">", "<"] as FilterOperator[]).map((op) => (
                                            <SelectItem key={op} value={op}>
                                                {op}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[11px] text-text-secondary">{t('value')}</Label>
                                <Input
                                    className="h-8 w-full text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                                    value={filterState.value}
                                    onChange={(e) => setFilterState((s) => ({...s, value: e.target.value}))}
                                    placeholder="65"
                                />
                            </div>
                        </div>

                        {/* % del día */}
                        <div className="space-y-1">
                            <Label htmlFor="dayPct" className="text-[11px] text-text-secondary">
                                {t('dayPercentage')}
                            </Label>
                            <div className="flex items-center gap-3">
                                <input
                                    id="dayPct"
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={Number(filterState.dayPct || 0)}
                                    onChange={(e) => setFilterState((s) => ({...s, dayPct: e.target.value}))}
                                    className="flex-1 accent-accent"
                                />
                                <span className="w-12 text-right text-xs text-text-primary">
                                    {filterState.dayPct || 0}%
                                </span>
                            </div>
                        </div>

                        {/* Días */}
                        <div className="space-y-1">
                            <Label className="text-[11px] text-text-secondary">{t('days')}</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-8 w-full justify-between px-2 text-xs bg-surface-1 border border-surface-3 hover:bg-surface-0 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                                    >
                                        {!daysRange?.from || !daysRange?.to
                                            ? t('allDays')
                                            : `${daysRange.from.toLocaleDateString()} - ${daysRange.to.toLocaleDateString()}`}
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent
                                    className="w-auto p-2 bg-surface-1 border border-surface-3 shadow-mac-panel">
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
                                            const daysStr = Array.from({length: toIdx + 1}, (_, i) => String(i)).join(";");
                                            setFilterState((s) => ({...s, days: daysStr}));
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Días excepción */}
                        <div className="space-y-1">
                            <Label className="text-[11px] text-text-secondary">{t('exceptionDays')}</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-8 w-full justify-between px-2 text-xs bg-surface-1 border border-surface-3 hover:bg-surface-0 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                                    >
                                        {filterState.allowedFailDays
                                            ? `${t('upTo')} ${filterState.allowedFailDays} ${t('days')}`
                                            : t('noExceptions')}
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent
                                    className="w-auto p-2 bg-surface-1 border border-surface-3 shadow-mac-panel">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] text-text-secondary">
                                            {t('maxFailDays')}
                                        </Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            className="h-8 w-full text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                                            value={filterState.allowedFailDays}
                                            onChange={(e) =>
                                                setFilterState((s) => ({...s, allowedFailDays: e.target.value}))
                                            }
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}
