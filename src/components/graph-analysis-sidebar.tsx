// components/graph-analysis-sidebar.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronsUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


const NULL_CHAR = '_';
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

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

type GraficaDef = { label: string; arg: string; backendArg?: string };

const GRAFICAS: GraficaDef[] = [
  { label: 'Gráfico de barra por estación (medio)', arg: 'graf_barras_est_med' },
  { label: 'Frecuencia de valores (acumulado estación)', arg: 'graf_barras_est_acum' },
  { label: 'Histograma del día (all-M-Frec)', arg: 'graf_barras_dia' },
  { label: 'Líneas (comparación estaciones)', arg: 'graf_linea', backendArg: 'graf_linea_comp_est' },
  { label: 'Gráfica de estaciones (barras día)', arg: 'graf_estaciones', backendArg: 'graf_barras_dia' },
  { label: 'Líneas comparación de estaciones', arg: 'graf_linea_comp_est' },
  { label: 'Líneas comparación de matrices', arg: 'graf_linea_comp_mats' },
];

const DELTA_OPTIONS = [
  { label: '15 min', value: '15' },
  { label: '30 min', value: '30' },
  { label: '60 min (1h)', value: '60' },
  { label: '120 min (2h)', value: '120' },
  { label: '1440 min (1 día)', value: '1440' },
  { label: 'Otro…', value: 'custom' },
];

export default function GraphAnalysisSidebar() {
  const [entrada, setEntrada] = useState('');
  const [salida, setSalida] = useState('');
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

  const [selectedCharts, setSelectedCharts] = useState<string[]>([]);
  const [instantesCharts, setInstantesCharts] = useState<
    Record<string, string>
  >({});
  const [stationPerChart, setStationPerChart] = useState<
    Record<string, string>
  >({});

  const toggleChart = (arg: string) => {
    let next = [...selectedCharts];
    if (next.includes(arg)) next = next.filter(x => x !== arg);
    else next.push(arg);
    setSelectedCharts(next);
  };

  const [selectedDeltaOption, setSelectedDeltaOption] = useState<string>('');
  const [customDelta, setCustomDelta] = useState<string>('');

  const effectiveDeltaAcum = useMemo(() => {
    if (!selectedDeltaOption) return '';
    if (selectedDeltaOption === 'custom') return customDelta.trim();
    return selectedDeltaOption;
  }, [selectedDeltaOption, customDelta]);

  const [filterEnabled, setFilterEnabled] = useState<boolean>(false);

  const [apiBusy, setApiBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (apiBusy) return;
    setApiBusy(true);
    setApiError(null);

    // delta_acumulada: number | null
    const deltaAcumuladaNum =
      effectiveDeltaAcum && effectiveDeltaAcum.length > 0
        ? Number(effectiveDeltaAcum)
        : null;


    // cuerpo base común para AnalysisArgs
    const baseBody: any = {
      input_folder: entrada || '',
      output_folder: salida || '',
      seleccion_agregacion: seleccionAgreg || '-1',

      delta_media: 60,
      delta_acumulada: deltaAcumuladaNum,

      graf_barras_est_med: null,
      graf_barras_est_acum: null,
      graf_barras_dia: null,
      graf_linea_comp_est: null,
      graf_linea_comp_mats: null,

      mapa_densidad: null,
      video_densidad: null,
      mapa_voronoi: null,
      mapa_circulo: null,
      mapa_desplazamientos: null,

      filtrado_EstValorDias: null,
      filtrado_Horas: null,
      filtrado_PorcentajeEstaciones: null,
    };

    const chartRequests = selectedCharts.map(async uiArg => {
      const def = GRAFICAS.find(d => d.arg === uiArg);
      const backendKey = def?.backendArg ?? uiArg;

      const body = { ...baseBody };

      if (uiArg === 'graf_barras_dia') {
        body.graf_barras_dia =
          instantesCharts[uiArg]?.trim() || 'all-M-Frec';
      } else if (
        uiArg === 'graf_barras_est_med' ||
        uiArg === 'graf_barras_est_acum'
      ) {
        const station = (stationPerChart[uiArg] || '0').trim();
        const dias = instantesCharts[uiArg]?.trim() || 'all';
        body[backendKey] = `${station}-${dias}`;
      } else {
        const raw = instantesCharts[uiArg]?.trim();
        body[backendKey] = raw && raw.length > 0 ? raw : null;
      }

      const res = await fetch(`${API_BASE}/exe/analizar-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(
          `Error analizando gráfica ${uiArg}: ${res.status} ${res.statusText}`
        );
      }
      const json = await res.json();
      console.log('Backend JSON for', uiArg, json);
      return json;
    });

    try {
      const results = await Promise.all(chartRequests);
      console.log('Resultados análisis gráficas (todas):', results);
      // aquí podrías guardar results[].charts en algún estado global
    } catch (e: any) {
      setApiError(e?.message ?? 'Error inesperado');
    } finally {
      setApiBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Paths */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 space-y-2">
          <div className="space-y-1">
            <Label htmlFor="entrada" className="text-xs">
              Entrada
            </Label>
            <Input
              id="entrada"
              value={entrada}
              onChange={e => setEntrada(e.target.value)}
              placeholder="results/20251124_...sim..."
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="salida" className="text-xs">
              Salida
            </Label>
            <Input
              id="salida"
              value={salida}
              onChange={e => setSalida(e.target.value)}
              placeholder="results/20251124_...sim..."
              className="h-8 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Analysis area */}
      <Card className="shadow-sm flex-1 min-h-0">
        <CardHeader className="py-2">
          <CardTitle className="text-sm font-semibold">Análisis</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3 h-[calc(100vh-18rem)] overflow-y-auto">
          {/* Matrices */}
          <div className="space-y-1">
            <Label className="text-xs">Matriz / combinación</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  size="sm"
                  className="w-full justify-between"
                >
                  {selectedIds.length > 0
                    ? `${selectedIds.length} seleccionada(s): ${selectedIds.join(
                        ';'
                      )}`
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
              onChange={e => setSeleccionAgreg(e.target.value)}
              placeholder="Ej: 1;2;3"
              className="h-8 text-xs"
            />
          </div>

          {/* Graph selection */}
          <div className="space-y-1">
            <Label className="text-xs">Tipo de gráfica</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  size="sm"
                  className="w-full justify-between"
                >
                  {selectedCharts.length > 0
                    ? `${selectedCharts.length} seleccionada(s)`
                    : 'Selecciona gráficas...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[340px] p-0 max-h-80 overflow-y-auto">
                <Command>
                  <CommandInput placeholder="Buscar gráfica..." />
                  <CommandEmpty>No encontrada</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {GRAFICAS.map(g => (
                        <div key={g.arg} className="flex flex-col py-1 px-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={selectedCharts.includes(g.arg)}
                              onCheckedChange={() => toggleChart(g.arg)}
                            />
                            <span className="text-xs">{g.label}</span>
                          </div>

                          {selectedCharts.includes(g.arg) &&
                            (g.arg === 'graf_barras_est_med' ||
                              g.arg === 'graf_barras_est_acum') && (
                              <div className="ml-6 mt-1 flex gap-2">
                                <Input
                                  className="w-16 h-7 text-xs"
                                  placeholder="Est."
                                  value={stationPerChart[g.arg] ?? '0'}
                                  onChange={e =>
                                    setStationPerChart({
                                      ...stationPerChart,
                                      [g.arg]: e.target.value,
                                    })
                                  }
                                />
                                <Input
                                  className="w-32 h-7 text-xs"
                                  placeholder="Días ej: all o 10;20"
                                  value={instantesCharts[g.arg] || ''}
                                  onChange={e =>
                                    setInstantesCharts({
                                      ...instantesCharts,
                                      [g.arg]: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            )}

                          {selectedCharts.includes(g.arg) &&
                            g.arg === 'graf_barras_dia' && (
                              <Input
                                className="ml-6 mt-1 w-[260px] h-7 text-xs"
                                value={
                                  instantesCharts[g.arg] || 'all-M-Frec'
                                }
                                onChange={e =>
                                  setInstantesCharts({
                                    ...instantesCharts,
                                    [g.arg]: e.target.value,
                                  })
                                }
                              />
                            )}

                          {selectedCharts.includes(g.arg) &&
                            ![
                              'graf_barras_est_med',
                              'graf_barras_est_acum',
                              'graf_barras_dia',
                            ].includes(g.arg) && (
                              <Input
                                className="ml-6 mt-1 w-[260px] h-7 text-xs"
                                value={instantesCharts[g.arg] || ''}
                                onChange={e =>
                                  setInstantesCharts({
                                    ...instantesCharts,
                                    [g.arg]: e.target.value,
                                  })
                                }
                                placeholder="Parámetro / días / instantes…"
                              />
                            )}
                        </div>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Delta transform */}
          <div className="space-y-1">
            <Label className="text-xs">Transformación de delta</Label>
            <div className="grid grid-cols-[1.1fr,0.9fr] gap-2 items-center">
              <Select
                value={selectedDeltaOption}
                onValueChange={setSelectedDeltaOption}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Sin cambio" />
                </SelectTrigger>
                <SelectContent>
                  {DELTA_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="h-8 text-xs"
                placeholder="Custom min. (opcional)"
                value={customDelta}
                onChange={e => setCustomDelta(e.target.value)}
                disabled={selectedDeltaOption !== 'custom'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleAnalyze}
          disabled={apiBusy || selectedCharts.length === 0}
        >
          {apiBusy ? 'Analizando…' : 'Analizar gráficas'}
        </Button>
        {apiError && (
          <span className="text-xs text-destructive">{apiError}</span>
        )}
      </div>
    </div>
  );
}
