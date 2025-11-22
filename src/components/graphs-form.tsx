'use client';

import * as React from 'react';
import { useState } from 'react';
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

const NULL_CHAR = '_';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

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
  // histograma medio estación: requiere "estacion-dias" (ej: 1-all, 2-10;20)
  { label: 'Gráfico de barra por estación (medio)', arg: 'graf_barras_est_med' },
  // histograma acumulado estación: también "estacion-dias"
  { label: 'Frecuencia de valores (acumulado estación)', arg: 'graf_barras_est_acum' },
  // histograma día: acepta all-M-Frec, etc.
  { label: 'Histograma del día (all-M-Frec)', arg: 'graf_barras_dia' },
  { label: 'Líneas (comparación estaciones)', arg: 'graf_linea', backendArg: 'graf_linea_comp_est' },
  { label: 'Gráfica de estaciones (barras día)', arg: 'graf_estaciones', backendArg: 'graf_barras_dia' },
  { label: 'Líneas comparación de estaciones', arg: 'graf_linea_comp_est' },
  { label: 'Líneas comparación de matrices', arg: 'graf_linea_comp_mats' },
];

export default function GraphSimulationForm() {
  const [entrada, setEntrada] = useState('');
  const [salida, setSalida] = useState('');
  const [seleccionAgreg, setSeleccionAgreg] = useState('');
  const [deltaAcumTxt, setDeltaAcumTxt] = useState('');
  const [apiBusy, setApiBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const selectedIds = seleccionAgreg
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s !== '');

  const toggleMatrix = (id: number) => {
    const idStr = String(id);
    let next = [...selectedIds];
    if (next.includes(idStr)) next = next.filter((x) => x !== idStr);
    else next.push(idStr);
    setSeleccionAgreg(next.join(';'));
  };

  const [selectedCharts, setSelectedCharts] = useState<string[]>([]);
  const [instantesCharts, setInstantesCharts] = useState<Record<string, string>>({});
  const [stationPerChart, setStationPerChart] = useState<Record<string, string>>({});

  const toggleChart = (arg: string) => {
    let next = [...selectedCharts];
    if (next.includes(arg)) next = next.filter((x) => x !== arg);
    else next.push(arg);
    setSelectedCharts(next);
  };

  const handleAnalyze = async () => {
    if (apiBusy) return;
    setApiBusy(true);
    setApiError(null);

    const nz = (s?: string) => (s && s.trim().length ? s.trim() : NULL_CHAR);

    const commonParams: Record<string, string> = {
      inputFolder: entrada || '',
      outputFolder: salida || '',
      seleccion_agregacion: seleccionAgreg || '-1',

      // Delta media ALWAYS 60 for graphs
      deltaMedia: '60',
      deltaAcumulada: nz(deltaAcumTxt),

      graf_barras_est_med: NULL_CHAR,
      graf_barras_est_acum: NULL_CHAR,
      graf_barras_dia: NULL_CHAR,
      graf_linea_comp_est: NULL_CHAR,
      graf_linea_comp_mats: NULL_CHAR,

      mapa_densidad: NULL_CHAR,
      video_densidad: NULL_CHAR,
      mapa_voronoi: NULL_CHAR,
      mapa_circulo: NULL_CHAR,
      mapa_desplazamientos: NULL_CHAR,

      filtrado_EstValor: NULL_CHAR,
      filtrado_EstValorDias: NULL_CHAR,
      filtrado_Horas: NULL_CHAR,
      filtrado_PorcentajeEstaciones: NULL_CHAR,
    };

    const chartRequests = selectedCharts.map(async (uiArg) => {
      const def = GRAFICAS.find((d) => d.arg === uiArg);
      const backendKey = def?.backendArg ?? uiArg;

      const params = { ...commonParams };

      if (uiArg === 'graf_barras_dia') {
        // histograma día: default all-M-Frec unless the user overrides
        const val = instantesCharts[uiArg]?.trim() || 'all-M-Frec';
        params['graf_barras_dia'] = val;
      } else if (uiArg === 'graf_barras_est_med' || uiArg === 'graf_barras_est_acum') {
        // station-based graphs: need "estacion-dias"
        const station = (stationPerChart[uiArg] || '0').trim(); // default station 0
        const dias = instantesCharts[uiArg]?.trim() || 'all';
        params[backendKey] = `${station}-${dias}`;
      } else {
        // other graphs: send raw value or _
        params[backendKey] =
          instantesCharts[uiArg]?.trim().length
            ? instantesCharts[uiArg].trim()
            : NULL_CHAR;
      }

      const search = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/exe/analizar?${search}`);
      if (!res.ok) throw new Error(`Error analizando gráfica ${uiArg}: ${res.statusText}`);
      return await res.json();
    });

    try {
      const results = await Promise.all(chartRequests);
      console.log('Resultados análisis gráficas:', results);
    } catch (e: any) {
      setApiError(e?.message ?? 'Error inesperado');
    } finally {
      setApiBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Entradas y opciones</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="entrada">Entrada ficheros</Label>
              <Input
                id="entrada"
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                placeholder="./Resultados_Simulador/Marzo_Reales"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="salida">Salida ficheros</Label>
              <Input
                id="salida"
                value={salida}
                onChange={(e) => setSalida(e.target.value)}
                placeholder="./Resultados_Analisis/Marzo_Reales"
              />
            </div>
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
                    ? `${selectedIds.length} seleccionada(s): ${selectedIds.join(';')}`
                    : 'Selecciona matrices...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
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
              onChange={(e) => setSeleccionAgreg(e.target.value)}
              placeholder="Ej: 1;2;3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-1">
              <Label htmlFor="deltaMedia">Delta Media (fijo)</Label>
              <Input
                id="deltaMedia"
                value="60"
                disabled
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="deltaAcum">Delta Acumulada</Label>
              <Input
                id="deltaAcum"
                value={deltaAcumTxt}
                onChange={(e) => setDeltaAcumTxt(e.target.value)}
                placeholder="4, 60, 1440…"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newDelta">Nuevo Delta (simulación)</Label>
              <Input
                id="newDelta"
                type="number"
                value={0}
                disabled
              />
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label>Gráficas a generar</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {selectedCharts.length > 0
                    ? `${selectedCharts.length} seleccionada(s): ${selectedCharts.join(';')}`
                    : 'Selecciona gráficas...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[460px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar gráfica..." />
                  <CommandEmpty>No encontrada</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {GRAFICAS.map((g) => (
                        <div key={g.arg} className="flex flex-col py-1 px-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={selectedCharts.includes(g.arg)}
                              onCheckedChange={() => toggleChart(g.arg)}
                            />
                            <span className="text-sm">{g.label}</span>
                          </div>

                          {/* Station + days for per-station graphs */}
                          {selectedCharts.includes(g.arg) &&
                            (g.arg === 'graf_barras_est_med' ||
                              g.arg === 'graf_barras_est_acum') && (
                              <div className="ml-6 mt-1 flex gap-2">
                                <Input
                                  className="w-20"
                                  placeholder="Est."
                                  value={stationPerChart[g.arg] ?? '0'}
                                  onChange={(e) =>
                                    setStationPerChart({
                                      ...stationPerChart,
                                      [g.arg]: e.target.value,
                                    })
                                  }
                                />
                                <Input
                                  className="w-64"
                                  placeholder="Días ej: all o 10;20"
                                  value={instantesCharts[g.arg] || ''}
                                  onChange={(e) =>
                                    setInstantesCharts({
                                      ...instantesCharts,
                                      [g.arg]: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            )}

                          {/* Histograma día: string estilo all-M-Frec */}
                          {selectedCharts.includes(g.arg) && g.arg === 'graf_barras_dia' && (
                            <Input
                              className="ml-6 mt-1 w-[320px]"
                              value={instantesCharts[g.arg] || 'all-M-Frec'}
                              onChange={(e) =>
                                setInstantesCharts({
                                  ...instantesCharts,
                                  [g.arg]: e.target.value,
                                })
                              }
                            />
                          )}

                          {/* Generic single-arg charts */}
                          {selectedCharts.includes(g.arg) &&
                            !['graf_barras_est_med', 'graf_barras_est_acum', 'graf_barras_dia'].includes(g.arg) && (
                              <Input
                                className="ml-6 mt-1 w-[320px]"
                                value={instantesCharts[g.arg] || ''}
                                onChange={(e) =>
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
            <Input
              value={selectedCharts
                .map((k) =>
                  instantesCharts[k]
                    ? `${k}(${instantesCharts[k]})`
                    : stationPerChart[k]
                    ? `${k}(${stationPerChart[k]}-${instantesCharts[k] || 'all'})`
                    : k,
                )
                .join(';')}
              readOnly
              placeholder="Ej: graf_barras_est_acum(1-10;20);graf_barras_dia(all-M-Frec)"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 items-center">
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
