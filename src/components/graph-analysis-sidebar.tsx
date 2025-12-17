// components/graph-analysis-sidebar.tsx
'use client';

import React, { useMemo, useState } from 'react';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
  CommandEmpty,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronsUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

type DaysSpec = 'all' | number[];

interface StationDays {
  station_id: number;
  days: DaysSpec;
}

interface GraphAnalysisSidebarProps {
  runId?: string;
}

const MATRICES = [
  { label: 'Matriz externa (usuario)', id: -1 },
  { label: 'Ocupación', id: 0 },
  { label: 'Ocupación relativa', id: 1 },
  { label: 'Km coger', id: 2 },
  { label: 'Km dejar', id: 3 },
  { label: 'Peticiones resueltas coger', id: 4 },
  { label: 'Peticiones resueltas dejar', id: 5 },
  { label: 'Peticiones no resueltas coger', id: 6 },
  { label: 'Peticiones no resueltas dejar', id: 7 },
  { label: 'Km ficticios coger', id: 8 },
  { label: 'Km ficticios dejar', id: 9 },
  { label: 'Ficticias resueltas coger', id: 10 },
  { label: 'Ficticias resueltas dejar', id: 11 },
  { label: 'Ficticias no resueltas coger', id: 12 },
  { label: 'Ficticias no resueltas dejar', id: 13 },
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

function buildFiltroFromUnified(kind: FilterKind, f: UnifiedFilterState, nullChar = '_'): string {
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

type GraficaKey =
  | 'graf_barras_est_med'
  | 'graf_barras_est_acum'
  | 'graf_barras_dia'
  | 'graf_linea_comp_est'
  | 'graf_linea_comp_mats';

type GraficaDef = { label: string; key: GraficaKey };

const GRAFICAS: GraficaDef[] = [
  { label: 'Barras por estación (media)', key: 'graf_barras_est_med' },
  { label: 'Barras por estación (acumulado)', key: 'graf_barras_est_acum' },
  { label: 'Histograma días (M/A + Frec)', key: 'graf_barras_dia' },
  { label: 'Líneas comparar estaciones', key: 'graf_linea_comp_est' },
  { label: 'Líneas comparar matrices', key: 'graf_linea_comp_mats' },
];

export default function GraphAnalysisSidebar({ runId }: GraphAnalysisSidebarProps) {
  const [seleccionAgreg, setSeleccionAgreg] = useState('');

  const selectedIds = useMemo(
    () =>
      seleccionAgreg
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s !== ''),
    [seleccionAgreg],
  );

  const toggleMatrix = (id: number) => {
    const idStr = String(id);
    let next = [...selectedIds];
    if (next.includes(idStr)) next = next.filter((x) => x !== idStr);
    else next.push(idStr);
    setSeleccionAgreg(next.join(';'));
  };

  const [selectedCharts, setSelectedCharts] = useState<GraficaKey[]>([]);
  const toggleChart = (key: GraficaKey) => {
    setSelectedCharts((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  };

  const [deltaMediaTxt, setDeltaMediaTxt] = useState('');
  const [deltaAcumTxt, setDeltaAcumTxt] = useState('');

  const nzInt = (s?: string) => (s && s.trim().length ? Number(s.trim()) : undefined);

  const [apiBusy, setApiBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filtro unificado
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
  const [useFilter, setUseFilter] = useState(false);

  // Parámetros específicos
  const [barStation, setBarStation] = useState<string>('87');
  const [barDays, setBarDays] = useState<string>('all');

  const [dayDays, setDayDays] = useState<string>('all');
  const [dayMode, setDayMode] = useState<'M' | 'A'>('M');
  const [dayFreq, setDayFreq] = useState<boolean>(true);

  const [lineStations, setLineStations] = useState<string>('87;212');
  const [lineDays, setLineDays] = useState<string>('all');

  const [matsDelta, setMatsDelta] = useState<string>('60');
  const [matsStations1, setMatsStations1] = useState<string>('87;212');
  const [matsStations2, setMatsStations2] = useState<string>('0;1');
  const [matsMode, setMatsMode] = useState<'M' | 'A'>('M');

  const buildStationDays = (): StationDays[] | undefined => {
    const estsStr = lineStations.trim();
    const daysStr = lineDays.trim();
    if (!estsStr || !daysStr) return undefined;

    const stations = estsStr
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !Number.isNaN(n));

    if (!stations.length) return undefined;

    if (daysStr === 'all') {
      return stations.map((st) => ({ station_id: st, days: 'all' as const }));
    }

    const parts = daysStr
      .split('#')
      .map((p) => p.trim())
      .filter(Boolean);

    let patterns = parts;
    if (parts.length === 1 && stations.length > 1) patterns = Array(stations.length).fill(parts[0]);
    else if (parts.length !== stations.length) return undefined;

    const specs: StationDays[] = [];
    stations.forEach((st, i) => {
      const p = patterns[i];
      if (p === 'all') {
        specs.push({ station_id: st, days: 'all' });
      } else {
        const dayNums = p
          .split(';')
          .map((d) => d.trim())
          .filter(Boolean)
          .map(Number)
          .filter((n) => !Number.isNaN(n));
        if (!dayNums.length) return;
        specs.push({ station_id: st, days: dayNums });
      }
    });

    return specs.length ? specs : undefined;
  };

  const buildGraficaArg = (key: GraficaKey): any | null => {
    if (key === 'graf_barras_est_med' || key === 'graf_barras_est_acum') {
      const est = barStation.trim();
      const dias = barDays.trim() || 'all';
      if (!est) return null;
      return `${est}-${dias}`;
    }

    if (key === 'graf_barras_dia') {
      const dias = dayDays.trim() || 'all';
      const mode = dayMode;
      const freqPart = dayFreq ? '-Frec' : '';
      return `${dias}-${mode}${freqPart}`;
    }

    if (key === 'graf_linea_comp_est') {
      const specs = buildStationDays();
      return specs ?? null;
    }

    if (key === 'graf_linea_comp_mats') {
      const d = matsDelta.trim();
      const e1 = matsStations1.trim();
      const e2 = matsStations2.trim();
      const mode = matsMode;
      if (!d || !e1 || !e2) return null;
      return `${d}-${e1}-${e2}-${mode}`;
    }

    return null;
  };

  const handleAnalyze = async () => {
    if (apiBusy || selectedCharts.length === 0) return;

    if (!runId) {
      setApiError('Selecciona una simulación en el historial antes de analizar.');
      return;
    }

    setApiBusy(true);
    setApiError(null);

    const filtroStr = useFilter ? buildFiltroFromUnified(filterKind, filterState, '_') : undefined;

    const commonPayload: any = {
      input_folder: `./results/${runId}`,
      output_folder: `./results/${runId}`,
      seleccion_agregacion: seleccionAgreg || '-1',
      delta_media: nzInt(deltaMediaTxt),
      delta_acumulada: nzInt(deltaAcumTxt),

      filtro: filtroStr,
      tipo_filtro: useFilter ? filterKind : undefined,
      use_filter_for_maps: false,
      use_filter_for_graphs: useFilter,

      filtrado_EstValor: undefined,
      filtrado_EstValorDias: undefined,
      filtrado_Horas: undefined,
      filtrado_PorcentajeEstaciones: undefined,
      filter_result_filename: null,
    };

    const requests = selectedCharts.map(async (key) => {
      const arg = buildGraficaArg(key);
      if (arg == null) throw new Error(`Parámetros inválidos para la gráfica ${key}`);

      const payload: any = { ...commonPayload };

      if (key === 'graf_barras_est_med') payload.graf_barras_est_med = arg;
      else if (key === 'graf_barras_est_acum') payload.graf_barras_est_acum = arg;
      else if (key === 'graf_barras_dia') payload.graf_barras_dia = arg;
      else if (key === 'graf_linea_comp_est') payload.graf_linea_comp_est = arg;
      else if (key === 'graf_linea_comp_mats') payload.graf_linea_comp_mats = arg;

      const res = await fetch(`${API_BASE}/exe/analizar-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(`Error analizando gráfica ${key}: ${res.status} ${(json as any)?.detail ?? ''}`);
      }
      return json;
    });

    try {
      await Promise.all(requests);
    } catch (e: any) {
      setApiError(e?.message ?? 'Error inesperado');
    } finally {
      setApiBusy(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable area */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Column 1 */}
          <div className="space-y-3">
            {/* Matrices */}
            <div className="space-y-1">
              <Label className="text-xs">Matriz / combinación</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" size="sm" className="w-full justify-between">
                    {selectedIds.length > 0
                      ? `${selectedIds.length} seleccionada(s): ${selectedIds.join(';')}`
                      : 'Selecciona matrices...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0 max-h-72 overflow-y-auto">
                  <Command>
                    <CommandInput placeholder="Buscar matriz..." />
                    <CommandEmpty>No encontrada</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {MATRICES.map((m) => (
                          <CommandItem
                            key={m.id}
                            onSelect={() => toggleMatrix(m.id)}
                            className="flex items-center space-x-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedIds.includes(String(m.id))}
                              onCheckedChange={() => toggleMatrix(m.id)}
                            />
                            <span className="text-xs">
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
                onChange={(e) => setSeleccionAgreg(e.target.value)}
                placeholder="Ej: 1;2;3"
                className="h-8 text-xs"
              />
            </div>

            {/* Deltas */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Delta Media</Label>
                <Input
                  value={deltaMediaTxt}
                  onChange={(e) => setDeltaMediaTxt(e.target.value)}
                  placeholder="60, 1440…"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Delta Acumulada</Label>
                <Input
                  value={deltaAcumTxt}
                  onChange={(e) => setDeltaAcumTxt(e.target.value)}
                  placeholder="60, 1440…"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-3">
            {/* Filtro unificado */}
            <div className="space-y-3 mt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="use-filter-graphs"
                  checked={useFilter}
                  onCheckedChange={(v) => setUseFilter(Boolean(v))}
                />
                <Label htmlFor="use-filter-graphs" className="text-xs">
                  Aplicar filtro (filtros backend)
                </Label>
              </div>

              {useFilter && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo de filtro</Label>
                    <select
                      className="w-full border rounded px-2 py-1 text-xs bg-background"
                      value={filterKind}
                      onChange={(e) => setFilterKind(e.target.value as FilterKind)}
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
                        onValueChange={(operator) => setFilterState((s) => ({ ...s, operator }))}
                      >
                        <SelectTrigger className="h-8 text-xs w-full">
                          <SelectValue />
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
                        onChange={(e) => setFilterState((s) => ({ ...s, value: e.target.value }))}
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
                        onChange={(e) => setFilterState((s) => ({ ...s, dayPct: e.target.value }))}
                        className="flex-1"
                      />
                      <span className="w-12 text-right text-sm">{filterState.dayPct || 0}%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Días</Label>
                    <Input
                      className="h-8 text-xs w-full"
                      value={filterState.days}
                      onChange={(e) => setFilterState((s) => ({ ...s, days: e.target.value }))}
                      placeholder="all o 0;1;2"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Días excepción</Label>
                    <Input
                      className="h-8 text-xs w-full"
                      value={filterState.allowedFailDays}
                      onChange={(e) => setFilterState((s) => ({ ...s, allowedFailDays: e.target.value }))}
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
                        onChange={(e) => setFilterState((s) => ({ ...s, stationsPct: e.target.value }))}
                        className="flex-1"
                      />
                      <span className="w-12 text-right text-sm">{filterState.stationsPct || 0}%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Estaciones (IDs ;)</Label>
                    <Input
                      className="h-8 text-xs w-full"
                      value={filterState.stationsList}
                      onChange={(e) => setFilterState((s) => ({ ...s, stationsList: e.target.value }))}
                      placeholder="1;15;26;48;..."
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-3">
            {/* Selección de gráficas + parámetros */}
            <div className="space-y-2">
              <Label className="text-xs">Gráficas</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" size="sm" className="w-full justify-between">
                    {selectedCharts.length > 0 ? `${selectedCharts.length} seleccionada(s)` : 'Selecciona gráficas...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[340px] p-0 max-h-80 overflow-y-auto">
                  <Command>
                    <CommandInput placeholder="Buscar gráfica..." />
                    <CommandEmpty>No encontrada</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {GRAFICAS.map((g) => (
                          <div key={g.key} className="flex flex-col py-1 px-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedCharts.includes(g.key)}
                                onCheckedChange={() => toggleChart(g.key)}
                              />
                              <span className="text-xs">{g.label}</span>
                            </div>

                            {selectedCharts.includes(g.key) &&
                              (g.key === 'graf_barras_est_med' || g.key === 'graf_barras_est_acum') && (
                                <div className="ml-6 mt-1 flex gap-2">
                                  <Input
                                    className="w-16 h-7 text-xs"
                                    placeholder="Est."
                                    value={barStation}
                                    onChange={(e) => setBarStation(e.target.value)}
                                    disabled={useFilter}
                                  />
                                  <Input
                                    className="w-32 h-7 text-xs"
                                    placeholder="Días: all o 0;1;2"
                                    value={barDays}
                                    onChange={(e) => setBarDays(e.target.value)}
                                  />
                                </div>
                              )}

                            {selectedCharts.includes(g.key) && g.key === 'graf_barras_dia' && (
                              <div className="ml-6 mt-1 space-y-1">
                                <Input
                                  className="w-40 h-7 text-xs"
                                  placeholder="Días: all o 0;1;2"
                                  value={dayDays}
                                  onChange={(e) => setDayDays(e.target.value)}
                                />
                                <div className="flex items-center gap-2">
                                  <Label className="text-[11px]">Modo</Label>
                                  <Select value={dayMode} onValueChange={(v) => setDayMode(v as 'M' | 'A')}>
                                    <SelectTrigger className="h-7 text-xs w-20">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="M">Media (M)</SelectItem>
                                      <SelectItem value="A">Acum. (A)</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  <Checkbox checked={dayFreq} onCheckedChange={(v) => setDayFreq(Boolean(v))} />
                                  <span className="text-[11px]">Frecuencia (-Frec)</span>
                                </div>
                              </div>
                            )}

                            {selectedCharts.includes(g.key) && g.key === 'graf_linea_comp_est' && (
                              <div className="ml-6 mt-1 space-y-1">
                                <Input
                                  className="w-[260px] h-7 text-xs"
                                  placeholder="Estaciones (ej: 87;212)"
                                  value={lineStations}
                                  onChange={(e) => setLineStations(e.target.value)}
                                  disabled={useFilter}
                                />
                                <Input
                                  className="w-[260px] h-7 text-xs"
                                  placeholder='Días por estación (ej: all o "0;1#2;3")'
                                  value={lineDays}
                                  onChange={(e) => setLineDays(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                  Usa "all" para todos los días; o cadenas separadas por "#" para cada estación (ej:
                                  0;1#2;3).
                                </p>
                              </div>
                            )}

                            {selectedCharts.includes(g.key) && g.key === 'graf_linea_comp_mats' && (
                              <div className="ml-6 mt-1 space-y-1">
                                <div className="flex gap-2">
                                  <Input
                                    className="w-16 h-7 text-xs"
                                    placeholder="Δ"
                                    value={matsDelta}
                                    onChange={(e) => setMatsDelta(e.target.value)}
                                  />
                                  <Select value={matsMode} onValueChange={(v) => setMatsMode(v as 'M' | 'A')}>
                                    <SelectTrigger className="h-7 text-xs w-20">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="M">Media</SelectItem>
                                      <SelectItem value="A">Acum.</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <Input
                                  className="w-[260px] h-7 text-xs"
                                  placeholder="Est. matriz base (ej: 87;212)"
                                  value={matsStations1}
                                  onChange={(e) => setMatsStations1(e.target.value)}
                                  disabled={useFilter}
                                />
                                <Input
                                  className="w-[260px] h-7 text-xs"
                                  placeholder="Est. matriz custom (ej: 0;1)"
                                  value={matsStations2}
                                  onChange={(e) => setMatsStations2(e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t mt-3 flex items-center gap-2">
        <Button size="sm" onClick={handleAnalyze} disabled={apiBusy || selectedCharts.length === 0}>
          {apiBusy ? 'Analizando…' : 'Analizar gráficas'}
        </Button>
        {apiError && <span className="text-xs text-destructive">{apiError}</span>}
      </div>
    </div>
  );
}
