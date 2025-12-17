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

interface MapAnalysisSidebarProps {
    // e.g. "20251210_140806_sim_ST0_S0.00_WC1.00_D15"
    runId?: string;
}

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

export default function StatisticsForm({runId}: MapAnalysisSidebarProps) {
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
    const [advancedUser, setAdvancedUser] = useState(false);
    const baseRunFolder = `./results/${runId}`;
    const inputFolder =
        advancedUser && entrada.trim().length > 0
            ? `./results/${entrada.trim()}`
            : baseRunFolder;
    const outputFolder =
        advancedUser && salida.trim().length > 0
            ? `./results/${salida.trim()}`
            : baseRunFolder;


    type DeltaMode = 'media' | 'acumulada';
    const [deltaMode, setDeltaMode] = useState<DeltaMode>('media');
    const [deltaValueTxt, setDeltaValueTxt] = useState('');

// Optional: separate advanced I/O boxes
    const [advancedEntrada, setAdvancedEntrada] = useState('');
    const [advancedSalida, setAdvancedSalida] = useState('');

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
// Lanzar análisis (MAPS) – SAME LOGIC AS GRAPHS
// -------------------------
    const handleAnalyze = async () => {
        if (!runId) {
            setApiError('Selecciona una simulación en el historial antes de analizar.');
            return;
        }
        if (apiBusy || selectedMaps.length === 0) return;

        setApiBusy(true);
        setApiError(null);

        const nzInt = (s?: string) =>
            s && s.trim().length ? Number(s.trim()) : undefined;

        const delta_media =
            advancedUser && deltaMode === 'media' ? nzInt(deltaValueTxt) : undefined;

        const delta_acumulada =
            advancedUser && deltaMode === 'acumulada' ? nzInt(deltaValueTxt) : undefined;

        const filtroStr =
            useFilterForMaps ? buildFiltroFromUnified(filterKind, filterState, '_') : undefined;

        const commonPayload: any = {
            input_folder: inputFolder,
            output_folder: outputFolder,
            seleccion_agregacion: seleccionAgreg || '-1',
            delta_media,
            delta_acumulada,
            filtro: filtroStr,
            tipo_filtro: useFilterForMaps ? filterKind : undefined,
            use_filter_for_maps: useFilterForMaps,
            use_filter_for_graphs: false,

            filtrado_EstValor: undefined,
            filtrado_EstValorDias: undefined,
            filtrado_Horas: undefined,
            filtrado_PorcentajeEstaciones: undefined,
            filter_result_filename: null,
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Column 1: Maps + Filter */}
                <div className="space-y-4">


                    {/* MULTIPLOS MAPAS   */}
                    {/* Mapas
<div className="space-y-2">
  <Label className="text-sm font-medium">Mapas a generar</Label>

  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" role="combobox" className="w-full justify-between">
        {selectedMaps.length > 0
          ? `${selectedMaps.length} ${selectedMaps.join(', ')}`
          : 'Selecciona mapas...'}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>

    <PopoverContent className="w-[360px] p-0">
      <Command>
        <CommandInput placeholder="Buscar mapa..." />
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
                <span className="ml-auto text-[10px] text-muted-foreground">{m.arg}</span>
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
            <span className="text-[10px] text-muted-foreground">{arg}</span>
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
                <Label htmlFor={`labels-${arg}`} className="text-[11px] cursor-pointer">
                  Abrir labels (-L)
                </Label>
              </div>
            )}

            {arg === 'mapa_desplazamientos' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Instante</Label>
                    <Input
                      className="h-8 text-xs"
                      value={instantesMaps['mapa_desplazamientos_inst'] || ''}
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
                    <Label className="text-[11px] text-muted-foreground">Δ origen</Label>
                    <Input
                      className="h-8 text-xs"
                      value={instantesMaps['mapa_desplazamientos_d_ori'] || ''}
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
                    <Label className="text-[11px] text-muted-foreground">Δ destino</Label>
                    <Input
                      className="h-8 text-xs"
                      value={instantesMaps['mapa_desplazamientos_d_dst'] || ''}
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
                    <Label className="text-[11px] text-muted-foreground">Movimiento</Label>
                    <Select
                      value={instantesMaps['mapa_desplazamientos_mov'] || ''}
                      onValueChange={v =>
                        setInstantesMaps({
                          ...instantesMaps,
                          mapa_desplazamientos_mov: v,
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecciona (1 / -1)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 (salidas)</SelectItem>
                        <SelectItem value="-1">-1 (entradas)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Tipo petición</Label>
                    <Select
                      value={instantesMaps['mapa_desplazamientos_tipo'] || ''}
                      onValueChange={v =>
                        setInstantesMaps({
                          ...instantesMaps,
                          mapa_desplazamientos_tipo: v,
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecciona (real / fict.)" />
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
</div>


leave the back at it is for future use, change only the input style here*/}

                    {/* Mapas */}
                    <div className="space-y-2">


                        {/* Select-style input (like Delta), but keeps selectedMaps: string[] for future */}
                        <div className="space-y-1">
                            <Select
                                value={selectedMaps[0] ?? ''}
                                onValueChange={(v) => setSelectedMaps(v ? [v] : [])}
                            >
                                <SelectTrigger className="h-8 text-xs w-full">
                                    <SelectValue placeholder="Selecciona mapa..."/>
                                </SelectTrigger>
                                <SelectContent>
                                    {MAPAS.map((m) => (
                                        <SelectItem key={m.arg} value={m.arg}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

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
                                            <span className="text-[10px] text-muted-foreground">{arg}</span>
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
                                                    <Label htmlFor={`labels-${arg}`}
                                                           className="text-[11px] cursor-pointer">
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
                                                                value={instantesMaps['mapa_desplazamientos_inst'] || ''}
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
                                                                value={instantesMaps['mapa_desplazamientos_d_ori'] || ''}
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
                                                                value={instantesMaps['mapa_desplazamientos_d_dst'] || ''}
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
                                                                value={instantesMaps['mapa_desplazamientos_mov'] || ''}
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
                                                                value={instantesMaps['mapa_desplazamientos_tipo'] || ''}
                                                                onValueChange={v =>
                                                                    setInstantesMaps({
                                                                        ...instantesMaps,
                                                                        mapa_desplazamientos_tipo: v,
                                                                    })
                                                                }
                                                            >
                                                                <SelectTrigger className="h-8 text-xs">
                                                                    <SelectValue
                                                                        placeholder="Selecciona (real / fict.)"/>
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
                    </div>


                    {/* Filtro */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="use-filter-maps"
                                checked={useFilterForMaps}
                                onCheckedChange={v => setUseFilterForMaps(Boolean(v))}
                            />
                            {/*   Usar filtro para limitar estaciones del mapa */}
                            <Label htmlFor="use-filter-maps" className="text-xs">
                                Habilitar Filtrado
                            </Label>
                        </div>

                        {useFilterForMaps && (
                            <>
                                <div className="space-y-1">
                                    <Label className="text-xs">Tipo de filtro</Label>
                                    <select
                                        className="w-full border rounded px-2 py-1 text-xs bg-background"
                                        value={filterKind}
                                        onChange={e => setFilterKind(e.target.value as FilterKind)}
                                    >
                                        <option value="EstValor">Estación valor (día)</option>
                                        <option value="EstValorDias">Estación valor (mes)</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Operador</Label>
                                        <Select
                                            value={filterState.operator}
                                            onValueChange={operator => setFilterState(s => ({...s, operator}))}
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
                                            onChange={e => setFilterState(s => ({...s, value: e.target.value}))}
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
                                            onChange={e => setFilterState(s => ({...s, dayPct: e.target.value}))}
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
                                        onChange={e => setFilterState(s => ({...s, days: e.target.value}))}
                                        placeholder="all o 0;1;2"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Días excepción</Label>
                                    <Input
                                        className="h-8 text-xs w-full"
                                        value={filterState.allowedFailDays}
                                        onChange={e =>
                                            setFilterState(s => ({...s, allowedFailDays: e.target.value}))
                                        }
                                        placeholder="5"
                                    />
                                </div>


                            </>
                        )}
                    </div>
                </div>

                {/* Column 2: Matrices */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className=" justify-between h-8 text-xs w-full">
                                    {selectedIds.length > 0
                                        ? `${selectedIds.length} seleccionada(s): ${selectedIds.join(';')}`
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
                    </div>


                </div>

                {/* Column 3: Advanced */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="advanced-user"
                            checked={advancedUser}
                            onCheckedChange={v => setAdvancedUser(Boolean(v))}
                        />
                        <Label htmlFor="advanced-user" className="text-xs">
                            Advanced user
                        </Label>
                    </div>

                    {advancedUser && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Delta</Label>
                                <Select value={deltaMode} onValueChange={v => setDeltaMode(v as DeltaMode)}>
                                    <SelectTrigger className="h-8 text-xs w-full">
                                        <SelectValue placeholder="Selecciona delta..."/>
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
                                    onChange={e => setDeltaValueTxt(e.target.value)}
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
                                    onChange={e => setAdvancedEntrada(e.target.value)}
                                    placeholder="..."
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="h-8 text-xs">Advanced output</Label>
                                <Input
                                    value={advancedSalida}
                                    onChange={e => setAdvancedSalida(e.target.value)}
                                    placeholder="..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Column 4: Analizar */}
                <div className="space-y-3">
                    <Button onClick={handleAnalyze} disabled={apiBusy} className="w-full">
                        {apiBusy ? 'Analizando...' : 'Analizar'}
                    </Button>

                    {apiError && <span className="text-sm text-destructive">{apiError}</span>}
                </div>
            </div>
        </div>
    );


}
