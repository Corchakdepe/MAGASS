"use client";

import * as React from "react";
import {useLanguage} from "@/contexts/LanguageContext";
import type {FiltersPanelProps, FilterItem} from "./types/filters";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
    FileJson,
    FileText,
    Calendar,
    Trash2,
    Download,
    ExternalLink,
    MapPin,
    Clock,
    Percent,
    Filter,
    Eye,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    CalendarDays,
    AlertCircle,
    Users,
    BarChart3,
    Hash
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {ScrollArea} from "@/components/ui/scroll-area";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {Separator} from "@/components/ui/separator";

// Types for parsed filter information
interface ParsedFilterInfo {
    type: 'stations' | 'percentage' | 'hours';
    typeDisplay: string;
    operator: string;
    operatorSymbol: string;
    operatorFull: string;
    value: number;
    coverageThreshold: number;
    dayIndex?: number;
    daysRange?: string;
    exceptionDays?: number;
    stationList?: string;
    date: Date;
    stations?: number[];
    percentage?: number;
    hours?: number[];
    stationCount?: number;
}

export function FiltersPanel({runId, filters = [], onRefresh, onDelete}: FiltersPanelProps) {
    const {t} = useLanguage();
    const [expandedFilter, setExpandedFilter] = React.useState<string | null>(null);
    const [copiedId, setCopiedId] = React.useState<string | null>(null);
    const [filterInfos, setFilterInfos] = React.useState<Map<string, ParsedFilterInfo>>(new Map());
    const [loading, setLoading] = React.useState<Map<string, boolean>>(new Map());

    // Parse operator from string
    const parseOperator = (opStr: string): { symbol: string; full: string; display: string } => {
        if (opStr.includes('MAYIGUAL') || opStr.includes('MAY=')) {
            return {symbol: '≥', full: 'greater than or equal to', display: 'MAYIGUAL'};
        }
        if (opStr.includes('MENIGUAL') || opStr.includes('MEN=')) {
            return {symbol: '≤', full: 'less than or equal to', display: 'MENIGUAL'};
        }
        if (opStr.includes('MAY')) {
            return {symbol: '>', full: 'greater than', display: 'MAY'};
        }
        if (opStr.includes('MEN')) {
            return {symbol: '<', full: 'less than', display: 'MEN'};
        }
        if (opStr.includes('IGUAL')) {
            return {symbol: '=', full: 'equal to', display: 'IGUAL'};
        }
        if (opStr.includes('DISTINTO')) {
            return {symbol: '≠', full: 'not equal to', display: 'DISTINTO'};
        }
        return {symbol: '?', full: 'unknown', display: 'UNKNOWN'};
    };

    // Parse filter filename and content
    const parseFilterInfo = async (filter: FilterItem): Promise<ParsedFilterInfo> => {
        const filename = filter.name;
        const parts = filename.split('_');

        // Parse timestamp (format: YYYYMMDD_HHMMSS)
        const datePart = parts[0];
        const timePart = parts[1];

        const date = new Date(
            parseInt(datePart.substring(0, 4)),
            parseInt(datePart.substring(4, 6)) - 1,
            parseInt(datePart.substring(6, 8)),
            timePart ? parseInt(timePart.substring(0, 2)) : 0,
            timePart ? parseInt(timePart.substring(2, 4)) : 0,
            timePart ? parseInt(timePart.substring(4, 6)) : 0
        );

        // Determine type
        let type: 'stations' | 'percentage' | 'hours' = 'stations';
        let typeDisplay = '';

        if (filename.includes('Filtrado_Estaciones')) {
            type = 'stations';
            typeDisplay = 'Station Filter';
        } else if (filename.includes('Filtrado_Porcentaje')) {
            type = 'percentage';
            typeDisplay = 'Percentage Filter';
        } else if (filename.includes('Filtrado_Horas')) {
            type = 'hours';
            typeDisplay = 'Hours Filter';
        }

        // Parse operator and value
        let operator = '';
        let operatorSymbol = '';
        let operatorFull = '';
        let value = 0;

        // Look for patterns like MAY65.0, MAY=65.0, MEN12.0, etc.
        const operatorMatch = filename.match(/(MAYIGUAL|MENIGUAL|MAY=|MEN=|MAY|MEN|IGUAL|DISTINTO)(\d+\.?\d*)/);
        if (operatorMatch) {
            const op = operatorMatch[1];
            value = parseFloat(operatorMatch[2]);

            const parsed = parseOperator(op);
            operator = parsed.display;
            operatorSymbol = parsed.symbol;
            operatorFull = parsed.full;
        }

        // Parse parameters based on pattern
        let coverageThreshold = 0;
        let dayIndex: number | undefined;
        let daysRange = 'all';
        let exceptionDays = 0;
        let stationList = '';

        // Find the parameters after the operator-value part
        const afterOperator = filename.split(operatorMatch?.[0] || '')[1] || '';
        const paramParts = afterOperator.split('_').filter((p: string) => p && !p.includes('.csv') && !p.includes('.txt'));

        if (paramParts.length >= 1) {
            // First parameter is usually coverage threshold (times per day)
            coverageThreshold = parseInt(paramParts[0]) || 0;
        }

        if (paramParts.length >= 2) {
            // Second parameter could be day index or 'all'
            if (paramParts[1] === 'all') {
                daysRange = 'all';
            } else if (!isNaN(parseInt(paramParts[1]))) {
                dayIndex = parseInt(paramParts[1]);
            }
        }

        if (paramParts.length >= 3) {
            // Third parameter is exception days
            exceptionDays = parseInt(paramParts[2]) || 0;
        }

        if (paramParts.length >= 4) {
            // Remaining parts might be station list
            stationList = paramParts.slice(3).join(';');
        }

        // Look for station list in brackets like [1, 2, 3] in filename
        const bracketMatch = filename.match(/\[(.*?)\]/);
        let filenameStations: number[] = [];
        if (bracketMatch) {
            filenameStations = bracketMatch[1].split(',').map((n: string) => parseInt(n.trim())).filter((n: number) => !isNaN(n));
            if (!stationList) {
                stationList = bracketMatch[1].replace(/,\s*/g, ';');
            }
        }

        // Fetch and parse content
        let stations: number[] = [];
        let percentage: number | undefined;
        let hours: number[] = [];

        setLoading(prev => new Map(prev).set(filter.id, true));

        if (filter.api_full_url) {
            try {
                const response = await fetch(filter.api_full_url);
                const content = await response.text();

                if (type === 'stations') {
                    stations = content.split(',').map((n: string) => parseInt(n.trim())).filter((n: number) => !isNaN(n));
                } else if (type === 'percentage') {
                    // Parse percentage from content (format: "76.38%" or just "76.38")
                    const match = content.match(/(\d+\.?\d*)%?/);
                    if (match) {
                        percentage = parseFloat(match[1]);
                    }
                } else if (type === 'hours') {
                    hours = content.split(',').map((n: string) => parseInt(n.trim())).filter((n: number) => !isNaN(n));
                }
            } catch (error) {
                console.error('Failed to fetch filter content:', error);
            }
        }

        setLoading(prev => {
            const newMap = new Map(prev);
            newMap.delete(filter.id);
            return newMap;
        });

        // Use filename stations if content stations are empty
        if (stations.length === 0 && filenameStations.length > 0) {
            stations = filenameStations;
        }

        return {
            type,
            typeDisplay,
            operator,
            operatorSymbol,
            operatorFull,
            value,
            coverageThreshold,
            dayIndex,
            daysRange,
            exceptionDays,
            stationList,
            date,
            stations,
            percentage,
            hours,
            stationCount: stations.length
        };
    };

    // Load filter info for all filters
    React.useEffect(() => {
        const loadAllFilters = async () => {
            const infos = new Map();
            for (const filter of filters) {
                try {
                    const info = await parseFilterInfo(filter);
                    infos.set(filter.id, info);
                } catch (error) {
                    console.error(`Failed to parse filter ${filter.id}:`, error);
                }
            }
            setFilterInfos(infos);
        };

        if (filters.length > 0) {
            loadAllFilters();
        }
    }, [filters]);

    const handleCopy = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getOperatorColor = (symbol: string) => {
        switch (symbol) {
            case '>':
                return 'text-success';
            case '≥':
                return 'text-success';
            case '<':
                return 'text-warning';
            case '≤':
                return 'text-warning';
            case '=':
                return 'text-info';
            case '≠':
                return 'text-danger';
            default:
                return 'text-text-primary';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'stations':
                return <MapPin size={16}/>;
            case 'percentage':
                return <Percent size={16}/>;
            case 'hours':
                return <Clock size={16}/>;
            default:
                return <Filter size={16}/>;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'stations':
                return 'bg-info/10 text-info border-info/20';
            case 'percentage':
                return 'bg-success/10 text-success border-success/20';
            case 'hours':
                return 'bg-warning/10 text-warning border-warning/20';
            default:
                return 'bg-surface-2/50 text-text-secondary';
        }
    };

    if (!runId) {
        return (
            <div className="h-full w-full flex items-center justify-center text-text-secondary p-6">
                <div className="text-center">
                    <Filter size={48} className="mx-auto mb-4 text-text-tertiary"/>
                    <p>{t("selectRunToViewFilters") || "Select a simulation run to view its filters"}</p>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="h-full w-full flex flex-col bg-surface-0">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-3 bg-surface-1/50">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary mb-1 flex items-center gap-2">
                            <Filter className="text-accent" size={24}/>
                            {t("filters") || "Filters"}
                        </h2>
                        <p className="text-sm text-text-secondary">
                            {t("manageRunFilters") || "Manage and view filters generated for this simulation"}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-surface-2 border-surface-3 px-3 py-1">
                            <Hash className="h-3 w-3 mr-1"/>
                            {filters.length} {filters.length === 1 ? 'filter' : 'filters'}
                        </Badge>
                        {onRefresh && (
                            <Button variant="outline" size="sm" onClick={onRefresh}>
                                {t("refresh") || "Refresh"}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters Grid */}
                <ScrollArea className="flex-1 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filters.length > 0 ? (
                            filters.map((filter) => {
                                const info = filterInfos.get(filter.id);
                                const isLoading = loading.get(filter.id);
                                const isExpanded = expandedFilter === filter.id;
                                const isCopied = copiedId === filter.id;

                                if (!info || isLoading) {
                                    return (
                                        <Card key={filter.id} className="border-surface-3 bg-surface-1/50">
                                            <CardContent className="p-6">
                                                <div className="animate-pulse space-y-3">
                                                    <div className="h-4 bg-surface-2 rounded w-3/4"></div>
                                                    <div className="h-3 bg-surface-2 rounded w-1/2"></div>
                                                    <div className="h-3 bg-surface-2 rounded w-2/3"></div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                }

                                return (
                                    <Card
                                        key={filter.id}
                                        className="border-surface-3 bg-surface-1/50 hover:bg-surface-1 transition-all duration-200 hover:shadow-md group"
                                    >
                                        <CardHeader className="pb-3 space-y-0">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={cn("p-2 rounded-md border", getTypeColor(info.type))}>
                                                        {getTypeIcon(info.type)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge variant="outline"
                                                                   className={cn("text-[9px] px-1.5 py-0", getTypeColor(info.type))}>
                                                                {info.typeDisplay}
                                                            </Badge>
                                                            <Badge variant="outline"
                                                                   className="text-[9px] px-1.5 py-0 bg-surface-2 border-surface-3">
                                                                {filter.format?.toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                        <CardTitle
                                                            className="text-xs font-mono text-text-secondary break-all line-clamp-2"
                                                            title={filter.name}>
                                                            {filter.name}
                                                        </CardTitle>
                                                    </div>
                                                </div>

                                                <div
                                                    className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {onDelete && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-text-tertiary hover:text-danger"
                                                                    onClick={() => onDelete(filter.id)}
                                                                >
                                                                    <Trash2 size={14}/>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{t("delete") || "Delete"}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-text-tertiary hover:text-text-primary"
                                                                onClick={() => setExpandedFilter(isExpanded ? null : filter.id)}
                                                            >
                                                                {isExpanded ? <ChevronUp size={14}/> :
                                                                    <ChevronDown size={14}/>}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{isExpanded ? t("collapse") || "Collapse" : t("expand") || "Expand"}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-3 pt-0">
                                            {/* Timestamp */}
                                            <div
                                                className="flex items-center gap-1.5 text-[10px] text-text-tertiary bg-surface-2/30 px-2 py-1 rounded-md">
                                                <Calendar size={10}/>
                                                {formatDate(info.date)}
                                            </div>

                                            {/* Filter Criteria Summary */}
                                            <div
                                                className="space-y-2 bg-surface-2/20 p-3 rounded-lg border border-surface-3/50">
                                                {/* Main condition */}
                                                <div className="flex items-center gap-2">
                                                    <Badge className={cn(
                                                        "font-mono text-xs border-2",
                                                        info.operatorSymbol === '>' ? 'border-success/30 bg-success/5' :
                                                            info.operatorSymbol === '≥' ? 'border-success/30 bg-success/5' :
                                                                info.operatorSymbol === '<' ? 'border-warning/30 bg-warning/5' :
                                                                    info.operatorSymbol === '≤' ? 'border-warning/30 bg-warning/5' :
                                                                        info.operatorSymbol === '=' ? 'border-info/30 bg-info/5' :
                                                                            info.operatorSymbol === '≠' ? 'border-danger/30 bg-danger/5' :
                                                                                'border-surface-3'
                                                    )}>
                            <span className={getOperatorColor(info.operatorSymbol)}>
                              {info.operatorSymbol} {info.value}
                            </span>
                                                    </Badge>
                                                    <span className="text-[10px] text-text-tertiary">
                            {info.operatorFull}
                          </span>
                                                </div>

                                                {/* Coverage threshold */}
                                                <div className="flex items-center gap-1.5 text-[11px]">
                                                    <BarChart3 size={12} className="text-accent"/>
                                                    <span className="text-text-secondary">Coverage:</span>
                                                    <span
                                                        className="font-medium text-text-primary">{info.coverageThreshold}</span>
                                                    <span className="text-text-tertiary">times/day</span>
                                                </div>

                                                {/* Days specification */}
                                                <div className="flex items-center gap-1.5 text-[11px]">
                                                    <CalendarDays size={12} className="text-info"/>
                                                    <span className="text-text-secondary">Days:</span>
                                                    {info.dayIndex !== undefined ? (
                                                        <span
                                                            className="font-medium text-text-primary">Day {info.dayIndex}</span>
                                                    ) : (
                                                        <span className="font-medium text-text-primary">
                              {info.daysRange === 'all' ? 'All days' : info.daysRange}
                            </span>
                                                    )}
                                                </div>

                                                {/* Exception days (if present) */}
                                                {(info.exceptionDays ?? 0) > 0 && (
                                                    <div className="flex items-center gap-1.5 text-[11px]">
                                                        <AlertCircle size={12} className="text-warning"/>
                                                        <span className="text-text-secondary">Exceptions allowed:</span>
                                                        <span
                                                            className="font-medium text-warning">{info.exceptionDays} days</span>
                                                    </div>
                                                )}

                                                {/* Station list (if present in filename) */}
                                                {info.stationList && (
                                                    <div className="flex items-center gap-1.5 text-[11px]">
                                                        <Users size={12} className="text-info"/>
                                                        <span className="text-text-secondary">Stations:</span>
                                                        <span
                                                            className="font-mono text-[9px] text-text-primary truncate">
                              {info.stationList}
                            </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Result Summary */}
                                            <div
                                                className="flex items-center justify-between border-t border-surface-3 pt-2">
                                                <span className="text-[10px] text-text-tertiary">Results:</span>
                                                {info.type === 'stations' && info.stations && (
                                                    <Badge variant="secondary"
                                                           className="bg-info/10 text-info border-info/20">
                                                        {info.stations.length} stations
                                                    </Badge>
                                                )}
                                                {info.type === 'percentage' && (
                                                    <div className="flex gap-1">
                                                        {info.stations && info.stations.length > 0 && (
                                                            <Badge variant="secondary"
                                                                   className="bg-info/10 text-info border-info/20">
                                                                {info.stations.length} stations
                                                            </Badge>
                                                        )}
                                                        {info.percentage !== undefined && (
                                                            <Badge variant="secondary"
                                                                   className="bg-success/10 text-success border-success/20">
                                                                {info.percentage.toFixed(1)}% of time
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                                {info.type === 'hours' && info.hours && (
                                                    <Badge variant="secondary"
                                                           className="bg-warning/10 text-warning border-warning/20">
                                                        {info.hours.length} hours
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div
                                                    className="mt-3 pt-3 border-t border-surface-3 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                    {/* Full Results Preview - Show stations for any filter type if available */}
                                                    {info.stations && info.stations.length > 0 && (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-medium text-text-secondary">
                                  {info.type === 'stations' ? 'Station IDs:' : 'Affected Stations:'}
                                </span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 px-2 text-[9px]"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleCopy(info.stations!.join(', '), filter.id);
                                                                    }}
                                                                >
                                                                    {isCopied ?
                                                                        <Check size={10} className="text-success"/> :
                                                                        <Copy size={10}/>}
                                                                </Button>
                                                            </div>
                                                            <ScrollArea
                                                                className="h-32 rounded-md border border-surface-3 p-2">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {info.stations.map((station, i) => (
                                                                        <Badge key={i} variant="outline"
                                                                               className="text-[9px] font-mono">
                                                                            {station}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </ScrollArea>
                                                        </div>
                                                    )}

                                                    {info.type === 'percentage' && info.percentage !== undefined && (
                                                        <div className="space-y-3 pt-2">
                                                            <div className="text-center">
                                                                <div className="text-3xl font-bold text-success">
                                                                    {info.percentage.toFixed(1)}%
                                                                </div>
                                                                <div className="text-[10px] text-text-tertiary mt-1">
                                                                    of the time
                                                                </div>
                                                            </div>
                                                            <div
                                                                className="w-full bg-surface-3 h-2 rounded-full overflow-hidden">
                                                                <div
                                                                    className="bg-success h-full rounded-full transition-all duration-500"
                                                                    style={{width: `${Math.min(info.percentage, 100)}%`}}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {info.type === 'hours' && info.hours && info.hours.length > 0 && (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span
                                                                    className="text-[10px] font-medium text-text-secondary">Hours:</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 px-2 text-[9px]"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleCopy(info.hours!.join(', '), filter.id);
                                                                    }}
                                                                >
                                                                    {isCopied ?
                                                                        <Check size={10} className="text-success"/> :
                                                                        <Copy size={10}/>}
                                                                </Button>
                                                            </div>
                                                            <ScrollArea
                                                                className="h-32 rounded-md border border-surface-3 p-2">
                                                                <div className="grid grid-cols-6 gap-1">
                                                                    {info.hours.map((hour, i) => (
                                                                        <Badge key={i} variant="outline"
                                                                               className="text-[8px] font-mono justify-center">
                                                                            {hour}:00
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </ScrollArea>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 pt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className={cn(
                                                        "flex-1 h-8 text-[11px]",
                                                        isExpanded && "bg-surface-3 border-surface-4"
                                                    )}
                                                    onClick={() => setExpandedFilter(isExpanded ? null : filter.id)}
                                                >
                                                    <Eye size={12} className="mr-1"/>
                                                    {isExpanded ? (t("hide") || "Hide") : (t("view") || "View")}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 h-8 text-[11px]"
                                                    asChild
                                                >
                                                    <a href={filter.api_full_url} download={filter.name}>
                                                        <Download size={12} className="mr-1"/>
                                                        {t("download") || "Download"}
                                                    </a>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <div
                                className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-surface-3 rounded-xl bg-surface-1/30">
                                <div className="p-4 rounded-full bg-surface-2 mb-4">
                                    <Filter size={48} className="text-text-tertiary"/>
                                </div>
                                <p className="text-base text-text-secondary font-medium">
                                    {t("noFiltersFound") || "No filters found for this run"}
                                </p>
                                <p className="text-sm text-text-tertiary mt-2 max-w-md text-center">
                                    {t("createFilterInSidebar") || "Create a new filter using the right sidebar. Filters help you analyze specific stations or time periods."}
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </TooltipProvider>
    );
}

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}