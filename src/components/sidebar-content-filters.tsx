// components/sidebar-content-filters.tsx
'use client';

import {useEffect, useState} from 'react';
import {useToast} from '@/hooks/use-toast';
import {
    SidebarHeader,
    SidebarContent as SidebarBody,
    SidebarFooter,
} from '@/components/ui/sidebar';
import {Button} from '@/components/ui/button';
import type {SimulationData} from '@/types/simulation';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {ChevronsUpDown, RefreshCw} from 'lucide-react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {Checkbox} from '@/components/ui/checkbox';
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card';
import type {RawResultItem} from '@/components/main-content';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// ======================
// Tipos y helpers filtro
// ======================

export type FilterKind = 'EstValor' | 'EstValorDias' | 'Horas' | 'Porcentaje';

type UnifiedFilterState = {
    operator: string;       // >=, <=, >, <
    value: string;          // 65
    dayPct: string;         // 20 (% del día)
    days: string;           // all o 0;1;2
    allowedFailDays: string; // 5 (días excepción)
    stationsPct: string;    // 35 (% estaciones)
    stationsList: string;   // "1;15;26;..."
};

export function buildFiltroFromUnified(
    kind: FilterKind,
    f: UnifiedFilterState,
    nullChar = '_',
): string {
    const v = f.value.trim();
    const days = f.days.trim() || 'all';
    const dayPct = f.dayPct.trim();
    const fail = f.allowedFailDays.trim();
    const pEst = f.stationsPct.trim();
    const list = f.stationsList.trim();

    if (kind === 'EstValor' || kind === 'EstValorDias') {
        if (!v || !dayPct || !fail) return nullChar;
        return `${f.operator}${v};${dayPct};${days};${fail}`;   // >=65;20;all;5
    }

    if (kind === 'Horas') {
        if (!v || !pEst) return nullChar;
        return `${f.operator}${v};${pEst}`;                    // >=65;35
    }

    if (kind === 'Porcentaje') {
        if (!v || !list) return nullChar;
        return `${f.operator}${v}-${list}`;                    // >=55-1;15;26;...
    }

    return nullChar;
}

// ======================
// Panel central resultados
// ======================

type FiltersPanelProps = {
    apiBase: string;
    runId: string;
};

type SidebarFiltersProps = {
    onSimulationComplete: (data: SimulationData) => void;
    runId?: string;  // NEW
};

type StationsResult = { stations: number[] };
type HoursResult = { hours: number[] };
type PercentResult = { percent: number };

function isStationsFile(name: string) {
    return name.includes('Filtrado_Estaciones');
}

function isHoursFile(name: string) {
    return name.includes('Filtrado_Horas') || name.toLowerCase().includes('horas');
}

function isPercentFile(name: string) {
    return (
        name.includes('PorcentajeEstaciones') ||
        name.toLowerCase().includes('porcentaje')
    );
}


export function FiltersPanel({apiBase, runId}: FiltersPanelProps) {
    const [files, setFiles] = useState<RawResultItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<RawResultItem | null>(null);
    const [stationsResult, setStationsResult] = useState<StationsResult | null>(null);
    const [hoursResult, setHoursResult] = useState<HoursResult | null>(null);
    const [percentResult, setPercentResult] = useState<PercentResult | null>(null);
    const [loading, setLoading] = useState(false);

    const loadFiles = async () => {
        if (!runId) return;
        setLoading(true);
        try {
            const res = await fetch(
                `${apiBase}/results/list?run=${encodeURIComponent(runId)}&kind=filter`,
                {cache: 'no-store'},
            );
            if (!res.ok) return;
            const {items} = await res.json();
            const all = (items as RawResultItem[]).filter(x =>
                x.name.includes('Filtrado_') || x.name.toLowerCase().includes('filtrado'),
            );
            setFiles(all);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setSelectedFile(null);
        setStationsResult(null);
        setHoursResult(null);
        setPercentResult(null);
        loadFiles();
    }, [runId]);

    const handleSelectFile = async (file: RawResultItem) => {
        setSelectedFile(file);
        setStationsResult(null);
        setHoursResult(null);
        setPercentResult(null);

        let kind: 'stations' | 'hours' | 'percent' = 'stations';
        if (isHoursFile(file.name)) kind = 'hours';
        else if (isPercentFile(file.name)) kind = 'percent';

        const res = await fetch(
            `${apiBase}/filters/result?run=${encodeURIComponent(
                runId,
            )}&filename=${encodeURIComponent(file.name)}&kind=${kind}`,
            {cache: 'no-store'},
        );
        if (!res.ok) return;
        const json = await res.json();

        if (kind === 'stations') {
            setStationsResult(json as StationsResult);
        } else if (kind === 'hours') {
            setHoursResult(json as HoursResult);
        } else {
            setPercentResult(json as PercentResult);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="text-sm">Ficheros de filtrado ({runId})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button size="sm" variant="outline" onClick={loadFiles}>
                        <RefreshCw className="mr-2 h-4 w-4"/>
                        Recargar
                    </Button>
                    {loading && (
                        <p className="text-xs text-muted-foreground">Cargando…</p>
                    )}
                    {!loading && files.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                            No se han encontrado ficheros de filtrado para esta simulación.
                        </p>
                    )}
                    <ul className="space-y-1 max-h-72 overflow-y-auto text-xs">
                        {files.map(f => (
                            <li key={f.id}>
                                <button
                                    type="button"
                                    onClick={() => handleSelectFile(f)}
                                    className={`w-full text-left px-2 py-1 rounded hover:bg-muted ${
                                        selectedFile?.id === f.id ? 'bg-muted' : ''
                                    }`}
                                >
                                    <div className="font-medium truncate">{f.name}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                        {f.created}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-sm">Resultado del filtro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    {!selectedFile && (
                        <p className="text-muted-foreground">
                            Selecciona un fichero de filtrado para ver sus resultados.
                        </p>
                    )}

                    {selectedFile && stationsResult && (
                        <div className="space-y-2">
                            <p>
                                Estaciones que cumplen el filtro: {stationsResult.stations.length}
                            </p>
                            <div className="border rounded p-2 max-h-64 overflow-y-auto">
                                {stationsResult.stations.join(', ')}
                            </div>
                        </div>
                    )}

                    {selectedFile && hoursResult && (
                        <div className="space-y-2">
                            <p>
                                Horas/instantes que cumplen el filtro: {hoursResult.hours.length}
                            </p>
                            <div className="border rounded p-2 max-h-64 overflow-y-auto">
                                {hoursResult.hours.join(', ')}
                            </div>
                        </div>
                    )}

                    {selectedFile && percentResult && (
                        <div className="space-y-2">
                            <p>
                                Porcentaje de tiempo que el conjunto cumple la condición:{' '}
                                <span className="font-semibold">
                  {percentResult.percent.toFixed(2)}%
                </span>
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ======================
// SidebarContentFilters
// ======================


const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000';

const MATRICES = [
    {label: 'Matriz externa (usuario)', id: -1},
    {label: 'Ocupación', id: 0},
    {label: 'Ocupación relativa', id: 1},
    {label: 'Km coger', id: 2},
    {label: 'Km dejar', id: 3},
    {label: 'Peticiones resueltas coger', id: 4},
    {label: 'Peticiones resueltas dejar', id: 5},
    {label: 'Peticiones no resueltas coger', id: 6},
    {label: 'Peticiones no resueltas dejar', id: 7},
    {label: 'Km ficticios coger', id: 8},
    {label: 'Km ficticios dejar', id: 9},
    {label: 'Ficticias resueltas coger', id: 10},
    {label: 'Ficticias resueltas dejar', id: 11},
    {label: 'Ficticias no resueltas coger', id: 12},
    {label: 'Ficticias no resueltas dejar', id: 13},
];

export default function SidebarContentFilters({
                                                  onSimulationComplete,
                                                  runId
                                              }: SidebarFiltersProps) {
    const {toast} = useToast();
    const [isRunning, setIsRunning] = useState(false);

    const [seleccionAgreg, setSeleccionAgreg] = useState('');
    const selectedIds = seleccionAgreg
        .split(';')
        .map(s => s.trim())
        .filter(s => s !== '');

    const toggleMatrix = (id: number) => {
        const idStr = String(id);
        let next = [...selectedIds];
        if (next.includes(idStr)) next = next.filter(x => x !== idStr);
        else next.push(idStr);
        setSeleccionAgreg(next.join(';'));
    };


    const [filterKind, setFilterKind] = useState<FilterKind>('EstValorDias');

    const [filterState, setFilterState] = useState<UnifiedFilterState>({
        operator: '>=',
        value: '65',
        dayPct: '0',
        days: 'all',
        allowedFailDays: '5',
        stationsPct: '0',
        stationsList: '',
    });

    const handleRunFilter = async () => {

        const filtro = buildFiltroFromUnified(filterKind, filterState, undefined);
        setIsRunning(true);
        try {
            const body = {
                run: runId || undefined,
                filtro,
                tipofiltro: filterKind,
                seleccionagregacion: seleccionAgreg === "-1" ? -1 : seleccionAgreg,
            };

            const response = await fetch(`${API_BASE}/exe/analizar-json`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || 'Filter analysis failed');
            }

            const result = await response.json();
            onSimulationComplete(result);

            toast({
                title: 'Filtro ejecutado',
                description: 'El análisis con filtrado ha finalizado correctamente.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description:
                    error instanceof Error ? error.message : 'Filter analysis failed',
            });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <>
            <SidebarHeader className="p-4">
                <h2 className="text-xl font-semibold font-headline">Filtrados</h2>
                <h3 className="text-s font-light font-headline">
                    Parámetros de filtrado
                </h3>
            </SidebarHeader>

            <SidebarBody className="p-4 space-y-4 overflow-y-auto text-sm">


                <div className="space-y-1">
                    <Label className="font-bold">Tipo de filtro</Label>
                    <select
                        className="w-full border rounded px-2 py-1 text-xs bg-background"
                        value={filterKind}
                        onChange={e =>
                            setFilterKind(e.target.value as FilterKind)
                        }
                    >
                        <option value="EstValor">Filtrado Estación Valor (día)</option>
                        <option value="EstValorDias">Filtrado EstValorDias (mes)</option>
                        <option value="Horas">Filtrado Horas críticas</option>
                        <option value="Porcentaje">Filtrado Porcentaje Estaciones</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label>Selección/agregación matrices</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                            >
                                {selectedIds.length > 0
                                    ? `${selectedIds.length} seleccionada(s): ${selectedIds.join(
                                        ';',
                                    )}`
                                    : 'Selecciona matrices...'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                            <Command>
                                <CommandInput placeholder="Buscar matriz..."/>
                                <CommandEmpty>No encontrada</CommandEmpty>
                                <CommandList>
                                    <CommandGroup>
                                        {MATRICES.map(m => (
                                            <CommandItem
                                                key={m.id}
                                                onSelect={() => toggleMatrix(m.id)}
                                                className="flex items-center space-x-2 cursor-pointer"
                                            >
                                                <Checkbox
                                                    checked={selectedIds.includes(String(m.id))}
                                                    onCheckedChange={() => toggleMatrix(m.id)}
                                                />
                                                <span className="text-sm">
                          {m.label} ({m.id})
                        </span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <Input
                        value={seleccionAgreg}
                        onChange={e => setSeleccionAgreg(e.target.value)}
                        placeholder="Ej: 1;2;3"
                    />
                </div>

                {/* Formulario unificado de filtro */}
                <div className="space-y-4">
                    <Label className="text-xs">Parámetros del filtro</Label>

                    {/* Operador y valor */}
                    <div className="space-y-2">
                        <div className="space-y-1">
                            <Label className="text-xs">Operador</Label>
                            <Select
                                value={filterState.operator}
                                onValueChange={operator =>
                                    setFilterState(s => ({...s, operator}))
                                }
                            >
                                <SelectTrigger className="h-8 text-xs w-full">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=">=">{'>='}</SelectItem>
                                    <SelectItem value="<=">{'<='}</SelectItem>
                                    <SelectItem value=">">{'>'}</SelectItem>
                                    <SelectItem value="<">{'<'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Valor</Label>
                            <Input
                                className="h-8 text-xs w-full"
                                value={filterState.value}
                                onChange={e =>
                                    setFilterState(s => ({...s, value: e.target.value}))
                                }
                                placeholder="65"
                            />
                        </div>
                    </div>

                    {/* % del día (slider) */}
                    <div className="space-y-1">
                        <Label htmlFor="dayPct" className="text-xs">
                            % del día
                        </Label>
                        <div className="flex items-center gap-3">
                            <input
                                id="dayPct"
                                type="range"
                                min={0}
                                max={100}
                                value={Number(filterState.dayPct || 0)}
                                onChange={e =>
                                    setFilterState(s => ({
                                        ...s,
                                        dayPct: e.target.value,
                                    }))
                                }
                                className="flex-1"
                            />
                            <span className="w-12 text-right text-sm">
                {filterState.dayPct || 0}%
              </span>
                        </div>
                    </div>

                    {/* Días */}
                    <div className="space-y-1">
                        <Label className="text-xs">Días</Label>
                        <Input
                            className="h-8 text-xs w-full"
                            value={filterState.days}
                            onChange={e =>
                                setFilterState(s => ({...s, days: e.target.value}))
                            }
                            placeholder="all o 0;1;2"
                        />
                    </div>

                    {/* Días excepción */}
                    <div className="space-y-1">
                        <Label className="text-xs">Días excepción</Label>
                        <Input
                            className="h-8 text-xs w-full"
                            value={filterState.allowedFailDays}
                            onChange={e =>
                                setFilterState(s => ({
                                    ...s,
                                    allowedFailDays: e.target.value,
                                }))
                            }
                            placeholder="5"
                        />
                    </div>

                    {/* % estaciones (slider) */}
                    <div className="space-y-1">
                        <Label htmlFor="stationsPct" className="text-xs">
                            % estaciones
                        </Label>
                        <div className="flex items-center gap-3">
                            <input
                                id="stationsPct"
                                type="range"
                                min={0}
                                max={100}
                                value={Number(filterState.stationsPct || 0)}
                                onChange={e =>
                                    setFilterState(s => ({
                                        ...s,
                                        stationsPct: e.target.value,
                                    }))
                                }
                                className="flex-1"
                            />
                            <span className="w-12 text-right text-sm">
                {filterState.stationsPct || 0}%
              </span>
                        </div>
                    </div>

                    {/* Lista de estaciones */}
                    <div className="space-y-1">
                        <Label className="text-xs">Estaciones (IDs ;)</Label>
                        <Input
                            className="h-8 text-xs w-full"
                            value={filterState.stationsList}
                            onChange={e =>
                                setFilterState(s => ({
                                    ...s,
                                    stationsList: e.target.value,
                                }))
                            }
                            placeholder="1;15;26;48;..."
                        />
                    </div>
                </div>


            </SidebarBody>

            <SidebarFooter className="p-4 border-t">
                <Button
                    onClick={handleRunFilter}
                    disabled={isRunning}
                    className="w-full"
                >
                    {isRunning ? 'Ejecutando filtro…' : 'Ejecutar filtro'}
                </Button>
            </SidebarFooter>
        </>
    );
}
