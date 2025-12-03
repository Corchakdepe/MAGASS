'use client';

import * as React from 'react';
import {useState} from 'react';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from '@/components/ui/popover';
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
    CommandInput,
    CommandEmpty,
} from '@/components/ui/command';
import {Checkbox} from '@/components/ui/checkbox';
import {ChevronsUpDown} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

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

const MAPAS = [
    {label: 'Mapa Densidad', arg: 'mapa_densidad'},
    {label: 'Video Densidad', arg: 'video_densidad'},
    {label: 'Mapa Voronoi', arg: 'mapa_voronoi'},
    {label: 'Mapa Círculo', arg: 'mapa_circulo'},
    {label: 'Mapa Desplazamientos', arg: 'mapa_desplazamientos'},
];

type FilterKind = 'EstValor' | 'EstValorDias' | 'Horas' | 'Porcentaje';


type UnifiedFilterState = {
    operator: string;
    value: string;
    dayPct: string;
    days: string;
    allowedFailDays: string;
    stationsPct: string;
    stationsList: string;
};

function buildFiltroFromUnified(
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
        return `${f.operator}${v};${dayPct};${days};${fail}`;
    }

    if (kind === 'Horas') {
        if (!v || !pEst) return nullChar;
        return `${f.operator}${v};${pEst}`;
    }

    if (kind === 'Porcentaje') {
        if (!v || !list) return nullChar;
        return `${f.operator}${v}-${list}`;
    }

    return nullChar;
}

export default function StatisticsForm() {
    const [entrada, setEntrada] = useState('');
    const [salida, setSalida] = useState('');
    const [seleccionAgreg, setSeleccionAgreg] = useState('');//matrix select
    const [deltaMediaTxt, setDeltaMediaTxt] = useState('');//delta media
    const [deltaAcumTxt, setDeltaAcumTxt] = useState('');//delta media ac
    const [apiBusy, setApiBusy] = useState(false);//controlar estado api
    const [apiError, setApiError] = useState<string | null>(null);//controlar estado api
    const [selectedMaps, setSelectedMaps] = useState<string[]>([]);//mapas a crear
    const [instantesMaps, setInstantesMaps] = useState<Record<string, string>>({}); //instantes de los mapas
    const [stationsMaps, setStationsMaps] = useState<Record<string, string>>({});//estaciones de los mapas
    const [labelsMaps, setLabelsMaps] = useState<Record<string, boolean>>({});//L del mapa de circulo

    const [filterKind, setFilterKind] = useState<FilterKind>('EstValorDias');
    const [filterState, setFilterState] = useState<UnifiedFilterState>({
        operator: '>=',
        value: '65',
        dayPct: '0',
        days: 'all',
        allowedFailDays: '5',
        stationsPct: '0',
        stationsList: '',
    });//valores base del filtrado
    const [useFilterForMaps, setUseFilterForMaps] = useState(false);//bool de usar filtro

    // -------------------------
    // Selección matrices
    // -------------------------
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

    // -------------------------
    // Mapas helpers
    // -------------------------
    const toggleMap = (apiKey: string) => {
        let next = [...selectedMaps];
        if (next.includes(apiKey)) next = next.filter(x => x !== apiKey);
        else next.push(apiKey);
        setSelectedMaps(next);
    };

    const buildMapArg = (apiKey: string): string | undefined => {
        if (apiKey === 'mapa_desplazamientos') {
            const inst = (instantesMaps['mapa_desplazamientos_inst'] || '').trim();
            const dOri = (instantesMaps['mapa_desplazamientos_d_ori'] || '').trim();
            const dDst = (instantesMaps['mapa_desplazamientos_d_dst'] || '').trim();
            const mov = (instantesMaps['mapa_desplazamientos_mov'] || '').trim();
            const tipo = (instantesMaps['mapa_desplazamientos_tipo'] || '').trim();
            if (!inst || !dOri || !dDst || !mov || !tipo) return undefined;
            return `${inst};${dOri};${dDst};${mov};${tipo}`;
        }

        const base = (instantesMaps[apiKey] || '').trim();
        if (!base) return undefined;

        const supportsStations =
            apiKey === 'mapa_densidad' ||
            apiKey === 'video_densidad' ||
            apiKey === 'mapa_circulo';

        let spec = base;

        if (supportsStations && !useFilterForMaps) {
            const stations = (stationsMaps[apiKey] || '').trim();
            if (stations) spec += `+${stations}`;
        }

        if (apiKey === 'mapa_circulo') {
            const labels = labelsMaps[apiKey] ?? false;
            if (labels) spec += '-L';
        }

        return spec;
    };

    // -------------------------
    // Lanzar análisis
    // -------------------------
    const handleAnalyze = async () => {
        if (apiBusy) return;
        setApiBusy(true);
        setApiError(null);

        const nzInt = (s?: string) =>
            s && s.trim().length ? Number(s.trim()) : undefined;

        const filtroStr = useFilterForMaps
            ? buildFiltroFromUnified(filterKind, filterState, '_')
            : undefined;

        const commonPayload: any = {
            input_folder: entrada || '',
            output_folder: salida || '',
            seleccion_agregacion: seleccionAgreg || '-1',

            delta_media: nzInt(deltaMediaTxt),
            delta_acumulada: nzInt(deltaAcumTxt),

            graf_barras_est_med: undefined,
            graf_barras_est_acum: undefined,
            graf_barras_dia: undefined,
            graf_linea_comp_est: undefined,
            graf_linea_comp_mats: undefined,

            mapa_densidad: undefined,
            video_densidad: undefined,
            mapa_voronoi: undefined,
            mapa_circulo: undefined,
            mapa_desplazamientos: undefined,

            filtro: filtroStr,
            tipo_filtro: useFilterForMaps ? filterKind : undefined,
            use_filter_for_maps: useFilterForMaps,

            filtrado_EstValor: undefined,
            filtrado_EstValorDias: undefined,
            filtrado_Horas: undefined,
            filtrado_PorcentajeEstaciones: undefined,
        };

        const mapRequests = selectedMaps.map(async apiKey => {
            const arg = buildMapArg(apiKey);
            const payload = {
                ...commonPayload,
                [apiKey]: arg,
            };

            const res = await fetch(`${API_BASE}/exe/analizar-json`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload),
            });

            const json = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(
                    `Error analizando mapa ${apiKey}: ${res.status} ${
                        (json as any)?.detail ?? ''
                    }`,
                );
            }
            return json;
        });

        try {
            await Promise.all(mapRequests);
        } catch (e: any) {
            setApiError(e?.message ?? 'Error inesperado');
        } finally {
            setApiBusy(false);
        }
    };

    // -------------------------
    // Render
    // -------------------------
    return (
        <div className="space-y-6">
            {/* Entradas y opciones */}
            <div className="space-y-4">
                <h3 className="text-base font-semibold">Entradas y opciones</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="entrada">Entrada ficheros</Label>
                        <Input
                            id="entrada"
                            value={entrada}
                            onChange={e => setEntrada(e.target.value)}
                            placeholder="./Resultados_Simulador"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="salida">Salida ficheros</Label>
                        <Input
                            id="salida"
                            value={salida}
                            onChange={e => setSalida(e.target.value)}
                            placeholder="./Resultados_Analisis"
                        />
                    </div>
                </div>

                {/* matrices */}
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

                {/* deltas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1">
                        <Label htmlFor="deltaMedia">Delta Media</Label>
                        <Input
                            id="deltaMedia"
                            value={deltaMediaTxt}
                            onChange={e => setDeltaMediaTxt(e.target.value)}
                            placeholder="4, 60, 1440…"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="deltaAcum">Delta Acumulada</Label>
                        <Input
                            id="deltaAcum"
                            value={deltaAcumTxt}
                            onChange={e => setDeltaAcumTxt(e.target.value)}
                            placeholder="4, 60, 1440…"
                        />
                    </div>
                </div>

                {/* Filtro para mapas */}
                <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="use-filter-maps"
                            checked={useFilterForMaps}
                            onCheckedChange={v => setUseFilterForMaps(Boolean(v))}
                        />
                        <Label htmlFor="use-filter-maps" className="text-xs">
                            Usar filtro para limitar estaciones del mapa
                        </Label>
                    </div>

                    {useFilterForMaps && (
                        <>
                            <div className="space-y-1">
                                <Label className="text-xs">Tipo de filtro</Label>
                                <select
                                    className="w-full border rounded px-2 py-1 text-xs bg-background"
                                    value={filterKind}
                                    onChange={e =>
                                        setFilterKind(e.target.value as FilterKind)
                                    }
                                >
                                    <option value="EstValor">Estación valor (día)</option>
                                    <option value="EstValorDias">Estación valor (mes)</option>
                                    <option value="Horas">Horas críticas</option>
                                    <option value="Porcentaje">Porcentaje estaciones</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
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
                        </>
                    )}
                </div>

                {/* Mapas */}
                <div className="space-y-2 mt-4">
                    <Label className="text-sm font-medium">Mapas a generar</Label>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                            >
                                {selectedMaps.length > 0
                                    ? `${selectedMaps.length} seleccionado(s): ${selectedMaps.join(
                                        ', ',
                                    )}`
                                    : 'Selecciona mapas...'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[360px] p-0">
                            <Command>
                                <CommandInput placeholder="Buscar mapa..."/>
                                <CommandEmpty>No encontrado</CommandEmpty>
                                <CommandList>
                                    <CommandGroup>
                                        {MAPAS.map(m => (
                                            <CommandItem
                                                key={m.arg}
                                                onSelect={() => toggleMap(m.arg)}
                                                className="flex items-center space-x-2 cursor-pointer"
                                            >
                                                <Checkbox
                                                    checked={selectedMaps.includes(m.arg)}
                                                    onCheckedChange={() => toggleMap(m.arg)}
                                                />
                                                <span className="text-sm">{m.label}</span>
                                                <span className="ml-auto text-[10px] text-muted-foreground">
                          {m.arg}
                        </span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <div className="space-y-3 pt-2">
                        {selectedMaps.map(arg => {
                            const m = MAPAS.find(mm => mm.arg === arg);
                            if (!m) return null;

                            return (
                                <div
                                    key={arg}
                                    className="border border-muted rounded-md px-3 py-2 space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium">{m.label}</span>
                                        <span className="text-[10px] text-muted-foreground">
                      {arg}
                    </span>
                                    </div>

                                    <div className="space-y-2 pl-1">
                                        {(arg === 'mapa_densidad' ||
                                            arg === 'mapa_voronoi' ||
                                            arg === 'mapa_circulo') && (
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-muted-foreground">
                                                    Instantes (ej: 0;10;20)
                                                </Label>
                                                <Input
                                                    className="h-8 text-xs w-full"
                                                    value={instantesMaps[arg] || ''}
                                                    onChange={e =>
                                                        setInstantesMaps({
                                                            ...instantesMaps,
                                                            [arg]: e.target.value,
                                                        })
                                                    }
                                                    placeholder="0;10;20"
                                                />
                                            </div>
                                        )}

                                        {arg === 'video_densidad' && (
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-muted-foreground">
                                                    Rango (ej: 0:1440 o 0:end)
                                                </Label>
                                                <Input
                                                    className="h-8 text-xs w-full"
                                                    value={instantesMaps[arg] || ''}
                                                    onChange={e =>
                                                        setInstantesMaps({
                                                            ...instantesMaps,
                                                            [arg]: e.target.value,
                                                        })
                                                    }
                                                    placeholder="0:1440 o 0:end"
                                                />
                                            </div>
                                        )}

                                        {(arg === 'mapa_densidad' ||
                                            arg === 'video_densidad' ||
                                            arg === 'mapa_circulo') && (
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-muted-foreground">
                                                    Estaciones (IDs ;, opcional)
                                                </Label>
                                                <Input
                                                    disabled={useFilterForMaps}
                                                    className="h-8 text-xs w-full"
                                                    value={stationsMaps[arg] || ''}
                                                    onChange={e =>
                                                        setStationsMaps({
                                                            ...stationsMaps,
                                                            [arg]: e.target.value,
                                                        })
                                                    }
                                                    placeholder={
                                                        useFilterForMaps
                                                            ? 'Usando estaciones del filtro'
                                                            : '1;15;26;48;...'
                                                    }
                                                />
                                            </div>
                                        )}

                                        {arg === 'mapa_circulo' && (
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`labels-${arg}`}
                                                    checked={labelsMaps[arg] ?? false}
                                                    onCheckedChange={checked =>
                                                        setLabelsMaps({
                                                            ...labelsMaps,
                                                            [arg]: Boolean(checked),
                                                        })
                                                    }
                                                />
                                                <Label
                                                    htmlFor={`labels-${arg}`}
                                                    className="text-[11px] cursor-pointer"
                                                >
                                                    Abrir labels (-L)
                                                </Label>
                                            </div>
                                        )}

                                        {arg === 'mapa_desplazamientos' && (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-muted-foreground">
                                                            Instante
                                                        </Label>
                                                        <Input
                                                            className="h-8 text-xs"
                                                            value={
                                                                instantesMaps['mapa_desplazamientos_inst'] || ''
                                                            }
                                                            onChange={e =>
                                                                setInstantesMaps({
                                                                    ...instantesMaps,
                                                                    mapa_desplazamientos_inst: e.target.value,
                                                                })
                                                            }
                                                            placeholder="10"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-muted-foreground">
                                                            Δ origen
                                                        </Label>
                                                        <Input
                                                            className="h-8 text-xs"
                                                            value={
                                                                instantesMaps['mapa_desplazamientos_d_ori'] || ''
                                                            }
                                                            onChange={e =>
                                                                setInstantesMaps({
                                                                    ...instantesMaps,
                                                                    mapa_desplazamientos_d_ori: e.target.value,
                                                                })
                                                            }
                                                            placeholder="15"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-muted-foreground">
                                                            Δ destino
                                                        </Label>
                                                        <Input
                                                            className="h-8 text-xs"
                                                            value={
                                                                instantesMaps['mapa_desplazamientos_d_dst'] || ''
                                                            }
                                                            onChange={e =>
                                                                setInstantesMaps({
                                                                    ...instantesMaps,
                                                                    mapa_desplazamientos_d_dst: e.target.value,
                                                                })
                                                            }
                                                            placeholder="720"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-muted-foreground">
                                                            Movimiento
                                                        </Label>
                                                        <Select
                                                            value={
                                                                instantesMaps['mapa_desplazamientos_mov'] || ''
                                                            }
                                                            onValueChange={v =>
                                                                setInstantesMaps({
                                                                    ...instantesMaps,
                                                                    mapa_desplazamientos_mov: v,
                                                                })
                                                            }
                                                        >
                                                            <SelectTrigger className="h-8 text-xs">
                                                                <SelectValue placeholder="Selecciona (1 / -1)"/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="1">1 (salidas)</SelectItem>
                                                                <SelectItem value="-1">-1 (entradas)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-muted-foreground">
                                                            Tipo petición
                                                        </Label>
                                                        <Select
                                                            value={
                                                                instantesMaps['mapa_desplazamientos_tipo'] || ''
                                                            }
                                                            onValueChange={v =>
                                                                setInstantesMaps({
                                                                    ...instantesMaps,
                                                                    mapa_desplazamientos_tipo: v,
                                                                })
                                                            }
                                                        >
                                                            <SelectTrigger className="h-8 text-xs">
                                                                <SelectValue placeholder="Selecciona (real / fict.)"/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="1">1 (real)</SelectItem>
                                                                <SelectItem value="0">0 (ficticia)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">
                            Resumen selección
                        </Label>
                        <Input
                            value={selectedMaps
                                .map(k => buildMapArg(k))
                                .filter(Boolean)
                                .join(';')}
                            readOnly
                            className="h-8 text-xs"
                            placeholder="Ej: mapa_circulo 0;10+1;15;26-L"
                        />
                    </div>
                </div>
            </div>
            <div className="flex gap-3 items-center pt-2 border-t">
                <Button onClick={handleAnalyze} disabled={apiBusy}>
                    {apiBusy ? 'Analizando...' : 'Analizar'}
                </Button>
                {apiError && (
                    <span className="text-sm text-destructive">{apiError}</span>
                )}
            </div>
        </div>
    );
}
