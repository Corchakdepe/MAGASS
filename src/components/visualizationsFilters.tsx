// components/sidebar-content-filters.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  SidebarHeader,
  SidebarContent as SidebarBody,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import type { SimulationData } from '@/types/simulation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChartSpline, ChevronsUpDown, Copy, RefreshCw } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RawResultItem } from '@/components/main-content';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

// ======================
// Tipos y helpers filtro
// ======================

export type FilterKind = 'EstValor' | 'EstValorDias' | 'Horas' | 'Porcentaje';

type UnifiedFilterState = {
  operator: string; // >=, <=, >, <
  value: string; // 65
  dayPct: string; // 20 (% del día)
  days: string; // all o 0;1;2
  allowedFailDays: string; // 5 (días excepción)
  stationsPct: string; // 35 (% estaciones)
  stationsList: string; // "1;15;26;..."
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
    return `${f.operator}${v};${dayPct};${days};${fail}`; // >=65;20;all;5
  }

  if (kind === 'Horas') {
    if (!v || !pEst) return nullChar;
    return `${f.operator}${v};${pEst}`; // >=65;35
  }

  if (kind === 'Porcentaje') {
    if (!v || !list) return nullChar;
    return `${f.operator}${v}-${list}`; // >=55-1;15;26;...
  }

  return nullChar;
}

// ======================
// Result viewer (interactive like graphs)
// ======================

type FiltersPanelProps = {
  apiBase: string;
  runId: string;
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
  return name.includes('PorcentajeEstaciones') || name.toLowerCase().includes('porcentaje');
}

function prettyLabelFromFilename(name: string) {
  let s = name.replace(/\.[^/.]+$/, '');
  s = s.replace(/^\d{8}_\d{6}_/, '');
  s = s.replace(/_/g, ' ');
  return s.trim();
}

export function FiltersPanel({ apiBase, runId }: FiltersPanelProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

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
        { cache: 'no-store' },
      );
      if (!res.ok) return;

      const { items } = await res.json();
      const all = (items as RawResultItem[]).filter(
        (x) => x.name.includes('Filtrado_') || x.name.toLowerCase().includes('filtrado'),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      `${apiBase}/filters/result?run=${encodeURIComponent(runId)}&filename=${encodeURIComponent(
        file.name,
      )}&kind=${kind}`,
      { cache: 'no-store' },
    );

    if (!res.ok) return;
    const json = await res.json();

    if (kind === 'stations') setStationsResult(json as StationsResult);
    else if (kind === 'hours') setHoursResult(json as HoursResult);
    else setPercentResult(json as PercentResult);
  };

  const downloadUrl = selectedFile
    ? `${apiBase}/results/download?run=${encodeURIComponent(runId)}&filename=${encodeURIComponent(
        selectedFile.name,
      )}`
    : null;

  const rightTitle = selectedFile ? prettyLabelFromFilename(selectedFile.name) : t('filterResult');

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <ChartSpline className="h-5 w-5 text-xl" />
        <h2 className="text-xl font-semibold right-1">{t('filterFiles')}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-4">
        {/* Left: list (graph-like) */}
        <div className="border rounded p-2 max-h-72 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground">
              {loading ? t('loading') : `${files.length} ${t('files')}`}
            </div>
          </div>

          <ul className="space-y-1 text-sm">
            {files.map((f) => {
              const listTitle = prettyLabelFromFilename(f.name);
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectFile(f)}
                    className={`w-full flex items-center gap-2 text-left px-2 py-1 rounded hover:bg-accent ${
                      selectedFile?.id === f.id ? 'bg-accent' : ''
                    }`}
                    title={f.name}
                  >
                    <span className="min-w-0 flex-1 truncate">{listTitle}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {f.created}
                    </span>
                  </button>
                </li>
              );
            })}
            {files.length === 0 && !loading && (
              <li className="text-xs text-muted-foreground px-2 py-1">
                {t('noFilterFilesForRun')}
              </li>
            )}
          </ul>
        </div>

        {/* Right: preview (graph-like) */}
        <div className="space-y-7">
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-sm truncate">{rightTitle}</CardTitle>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {selectedFile?.name ?? t('selectFileToViewResult')}
                  </div>
                </div>

                {downloadUrl && (
                  <a href={downloadUrl} download className="text-xs underline text-primary">
                    {t('download')}
                  </a>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              {!selectedFile && (
                <p className="text-muted-foreground">
                  {t('selectFilterFileToViewResults')}
                </p>
              )}

              {selectedFile && stationsResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p>{t('stationsMeetingFilter')}: {stationsResult.stations.length}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(stationsResult.stations.join(';'));
                          toast({ title: t('copied'), description: t('idsCopiedToClipboard') });
                        } catch {
                          toast({
                            variant: 'destructive',
                            title: t('error'),
                            description: t('couldNotCopyToClipboard'),
                          });
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {t('copyIDs')}
                    </Button>
                  </div>

                  <div className="border rounded p-2 max-h-64 overflow-y-auto text-xs">
                    {stationsResult.stations.join(', ')}
                  </div>
                </div>
              )}

              {selectedFile && hoursResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p>{t('hoursMeetingFilter')}: {hoursResult.hours.length}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(hoursResult.hours.join(';'));
                          toast({ title: t('copied'), description: t('hoursCopiedToClipboard') });
                        } catch {
                          toast({
                            variant: 'destructive',
                            title: t('error'),
                            description: t('couldNotCopyToClipboard'),
                          });
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {t('copy')}
                    </Button>
                  </div>

                  <div className="border rounded p-2 max-h-64 overflow-y-auto text-xs">
                    {hoursResult.hours.join(', ')}
                  </div>
                </div>
              )}

              {selectedFile && percentResult && (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs">
                    {t('percentageTimeMeetingCondition')}
                  </p>
                  <div className="text-3xl font-semibold">
                    {percentResult.percent.toFixed(2)}%
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

// ======================
// SidebarContentFilters (interactive like graphs)
// ======================

type SidebarFiltersProps = {
  onSimulationComplete: (data: SimulationData) => void;
  runId?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000';

const DEFAULT_KIND: FilterKind = 'EstValorDias';
const DEFAULT_STATE: UnifiedFilterState = {
  operator: '>=',
  value: '65',
  dayPct: '0',
  days: 'all',
  allowedFailDays: '5',
  stationsPct: '0',
  stationsList: '',
};

export default function VisualizationsFilters({
  onSimulationComplete,
  runId,
}: SidebarFiltersProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const MATRICES = [
    { label: t('externalMatrixUser'), id: -1 },
    { label: t('occupation'), id: 0 },
    { label: t('relativeOccupation'), id: 1 },
    { label: t('kmPickup'), id: 2 },
    { label: t('kmDropoff'), id: 3 },
    { label: t('resolvedRequestsPickup'), id: 4 },
    { label: t('resolvedRequestsDropoff'), id: 5 },
    { label: t('unresolvedRequestsPickup'), id: 6 },
    { label: t('unresolvedRequestsDropoff'), id: 7 },
    { label: t('fictionalKmPickup'), id: 8 },
    { label: t('fictionalKmDropoff'), id: 9 },
    { label: t('fictionalResolvedPickup'), id: 10 },
    { label: t('fictionalResolvedDropoff'), id: 11 },
    { label: t('fictionalUnresolvedPickup'), id: 12 },
    { label: t('fictionalUnresolvedDropoff'), id: 13 },
  ];

  const [isRunning, setIsRunning] = useState(false);

  const [seleccionAgreg, setSeleccionAgreg] = useState('');
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

  const [filterKind, setFilterKind] = useState<FilterKind>(DEFAULT_KIND);
  const [filterState, setFilterState] = useState<UnifiedFilterState>(DEFAULT_STATE);

  // Interactive: show compiled filtro + validate
  const compiledFiltro = useMemo(
    () => buildFiltroFromUnified(filterKind, filterState, '_'),
    [filterKind, filterState],
  );

  const isValid = useMemo(() => compiledFiltro !== '_' && compiledFiltro.trim() !== '', [compiledFiltro]);

  const validationMessage = useMemo(() => {
    if (isValid) return null;

    if (filterKind === 'EstValor' || filterKind === 'EstValorDias') {
      return t('completeValueDayPercentExceptionDays');
    }
    if (filterKind === 'Horas') {
      return t('completeValueStationsPercent');
    }
    if (filterKind === 'Porcentaje') {
      return t('completeValueStationsList');
    }
    return t('completeRequiredFields');
  }, [filterKind, isValid, t]);

  const handleCopyFiltro = async () => {
    try {
      await navigator.clipboard.writeText(compiledFiltro);
      toast({ title: t('copied'), description: t('filterCopiedToClipboard') });
    } catch {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('couldNotCopyToClipboard'),
      });
    }
  };

  const handleReset = () => {
    setFilterKind(DEFAULT_KIND);
    setFilterState(DEFAULT_STATE);
    setSeleccionAgreg('');
  };

  const handleRunFilter = async () => {
    if (!runId) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('runIdNotAvailable'),
      });
      return;
    }

    if (!isValid) {
      toast({
        variant: 'destructive',
        title: t('incompleteFilter'),
        description: validationMessage ?? t('completeRequiredFields'),
      });
      return;
    }

    setIsRunning(true);
    try {
      const body = {
        input_folder: `./results/${runId}`,
        output_folder: `./results/${runId}`,
        seleccion_agregacion: seleccionAgreg?.trim() ? seleccionAgreg.trim() : '-1',
        filtro: compiledFiltro,
        tipo_filtro: filterKind,
      };

      const response = await fetch(`${API_BASE}/exe/analizar-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Filter analysis failed');
      }

      const result = await response.json();
      onSimulationComplete(result);

      toast({
        title: t('filterExecuted'),
        description: t('filterAnalysisCompleted'),
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error instanceof Error ? error.message : t('filterAnalysisFailed'),
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <>
      <SidebarHeader className="p-4">
        <h2 className="text-xl font-semibold font-headline">{t('filters')}</h2>
        <h3 className="text-s font-light font-headline">{t('filterParameters')}</h3>
      </SidebarHeader>

      <SidebarBody className="p-4 space-y-4 overflow-y-auto text-sm">
        {/* Controls row (interactive actions like graphs) */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={isRunning}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('reset')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyFiltro}
            disabled={compiledFiltro === '_' || isRunning}
          >
            <Copy className="h-4 w-4 mr-2" />
            {t('copyFilter')}
          </Button>
        </div>

        {/* Compiled preview */}
        <div className="border rounded p-2 bg-muted/30">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground">{t('generatedFilter')}</div>
              <div className="font-mono text-xs break-all">{compiledFiltro}</div>
            </div>
            <div
              className={`text-[10px] px-2 py-1 rounded border ${
                isValid ? 'text-foreground' : 'text-destructive border-destructive/40'
              }`}
              title={validationMessage ?? undefined}
            >
              {isValid ? 'OK' : t('incomplete')}
            </div>
          </div>
          {!isValid && validationMessage && (
            <div className="text-[11px] text-destructive mt-1">{validationMessage}</div>
          )}
        </div>

        {/* Tipo */}
        <div className="space-y-1">
          <Label className="font-bold">{t('filterType')}</Label>
          <select
            className="w-full border rounded px-2 py-1 text-xs bg-background"
            value={filterKind}
            onChange={(e) => setFilterKind(e.target.value as FilterKind)}
          >
            <option value="EstValor">{t('stationValueFilterDay')}</option>
            <option value="EstValorDias">{t('stationValueFilterMonth')}</option>
            <option value="Horas">{t('criticalHoursFilter')}</option>
            <option value="Porcentaje">{t('stationsPercentageFilter')}</option>
          </select>
        </div>

        {/* Matrices selection */}
        <div className="space-y-2">
          <Label>{t('matrixSelectionAggregation')}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between">
                {selectedIds.length > 0
                  ? `${selectedIds.length} ${t('selected')}: ${selectedIds.join(';')}`
                  : t('selectMatrices')}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput placeholder={t('searchMatrix')} />
                <CommandEmpty>{t('notFound')}</CommandEmpty>
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
            placeholder={t('matrixPlaceholder')}
          />
        </div>

        {/* Unified filter form */}
        <div className="space-y-4">
          <Label className="text-xs">{t('filterParameters')}</Label>

          {/* Operador y valor */}
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">{t('operator')}</Label>
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
              <Label className="text-xs">{t('value')}</Label>
              <Input
                className="h-8 text-xs w-full"
                value={filterState.value}
                onChange={(e) => setFilterState((s) => ({ ...s, value: e.target.value }))}
                placeholder="65"
              />
            </div>
          </div>

          {/* % del día */}
          <div className="space-y-1">
            <Label htmlFor="dayPct" className="text-xs">
              {t('dayPercentage')}
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

          {/* Días */}
          <div className="space-y-1">
            <Label className="text-xs">{t('days')}</Label>
            <Input
              className="h-8 text-xs w-full"
              value={filterState.days}
              onChange={(e) => setFilterState((s) => ({ ...s, days: e.target.value }))}
              placeholder={t('daysPlaceholder')}
            />
          </div>

          {/* Días excepción */}
          <div className="space-y-1">
            <Label className="text-xs">{t('exceptionDays')}</Label>
            <Input
              className="h-8 text-xs w-full"
              value={filterState.allowedFailDays}
              onChange={(e) =>
                setFilterState((s) => ({ ...s, allowedFailDays: e.target.value }))
              }
              placeholder="5"
            />
          </div>

          {/* % estaciones */}
          <div className="space-y-1">
            <Label htmlFor="stationsPct" className="text-xs">
              {t('stationsPercentage')}
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

          {/* Lista de estaciones */}
          <div className="space-y-1">
            <Label className="text-xs">{t('stationsIDsSemicolon')}</Label>
            <Input
              className="h-8 text-xs w-full"
              value={filterState.stationsList}
              onChange={(e) => setFilterState((s) => ({ ...s, stationsList: e.target.value }))}
              placeholder={t('stationsListPlaceholder')}
            />
          </div>
        </div>

        {/* Interactive results section inside the sidebar */}
        {runId && (
          <div className="pt-2">
            <FiltersPanel apiBase={API_BASE} runId={runId} />
          </div>
        )}
      </SidebarBody>

      <SidebarFooter className="p-4 border-t">
        <Button onClick={handleRunFilter} disabled={isRunning || !runId || !isValid} className="w-full">
          {isRunning ? t('executingFilter') : t('executeFilter')}
        </Button>
      </SidebarFooter>
    </>
  );
}
