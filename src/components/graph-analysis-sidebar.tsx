"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { MapsAndGraphsFilterControls } from "@/components/MapsAndGraphsFilterControls";
import { MatrixSelect } from "@/components/MatrixSelect";
import { GraphsSelectorCard } from "@/components/GraphsSelectorCard";
import { AdvancedControls } from "@/components/AdvancedControls";

import { usePersistentState } from "@/hooks/usePersistentState";

import type { FilterKind, UnifiedFilterState } from "@/types/analysis";
import { MATRICES } from "@/lib/analysis/constants";
import { analyzeGraphs } from "@/lib/analysis/graphs/api";

type GraficaKey =
  | "graf_barras_est_med"
  | "graf_barras_est_acum"
  | "graf_barras_dia"
  | "graf_linea_comp_est"
  | "graf_linea_comp_mats";

type GraficaDef = { label: string; key: GraficaKey };

const GRAFICAS: GraficaDef[] = [
  { label: "Barras por estación (media)", key: "graf_barras_est_med" },
  { label: "Barras por estación (acumulado)", key: "graf_barras_est_acum" },
  { label: "Histograma días (M/A + Frec)", key: "graf_barras_dia" },
  { label: "Líneas comparar estaciones", key: "graf_linea_comp_est" },
  { label: "Líneas comparar matrices", key: "graf_linea_comp_mats" },
];

interface GraphAnalysisSidebarProps {
  runId?: string;
}

function encodeRangeAsDayList(range?: DateRange): string {
  if (!range?.from || !range?.to) return "all";

  const from = range.from;
  const to = range.to;

  const days: number[] = [];
  const current = new Date(from);
  while (current <= to) {
    days.push(current.getDate());
    current.setDate(current.getDate() + 1);
  }

  return days.join(";");
}

function dateDiffInDays(a: Date, b: Date) {
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((a0.getTime() - b0.getTime()) / (24 * 60 * 60 * 1000));
}

export default function GraphAnalysisSidebar({ runId }: GraphAnalysisSidebarProps) {
  // Matrix
  const [seleccionAgreg, setSeleccionAgreg, seleccionHydrated] =
    usePersistentState<string>("graphs_seleccionAgreg", "");

  // Selected graphs
  const [selectedCharts, setSelectedCharts, chartsHydrated] =
    usePersistentState<GraficaKey[]>("graphs_selectedCharts", []);

  // Unified filter
  const [filterKind, setFilterKind, filterKindHydrated] =
    usePersistentState<FilterKind>("graphs_filterKind", "EstValorDias");

  const [filterState, setFilterState, filterStateHydrated] =
    usePersistentState<UnifiedFilterState>("graphs_filterState", {
      operator: ">=",
      value: "65",
      dayPct: "0",
      days: "all",
      allowedFailDays: "5",
      stationsPct: "0",
      stationsList: "",
    });

  const [useFilter, setUseFilter, useFilterHydrated] =
    usePersistentState<boolean>("graphs_useFilter", false);

  const [daysRange, setDaysRange] = React.useState<DateRange | undefined>();

  // AdvancedControls (delta + folders)
  const [advancedUser, setAdvancedUser, advancedHydrated] =
    usePersistentState<boolean>("graphs_advancedUser", false);

  const [deltaMode, setDeltaMode, deltaModeHydrated] =
    usePersistentState<"media" | "acumulada">("graphs_deltaMode", "media");

  const [deltaValueTxt, setDeltaValueTxt, deltaValueHydrated] =
    usePersistentState<string>("graphs_deltaValueTxt", "");

  const [advancedEntrada, setAdvancedEntrada, advEntradaHydrated] =
    usePersistentState<string>("graphs_advancedEntrada", "");

  const [advancedSalida, setAdvancedSalida, advSalidaHydrated] =
    usePersistentState<string>("graphs_advancedSalida", "");

  // Required by analyzeGraphs type: derive from AdvancedControls
  const deltaMediaTxt = advancedUser && deltaMode === "media" ? deltaValueTxt : "";
  const deltaAcumTxt = advancedUser && deltaMode === "acumulada" ? deltaValueTxt : "";

  // Graph params
  const [barStations, setBarStations, barStationsHydrated] =
    usePersistentState<string>("graphs_barStations", "87;212");
  const [barDays, setBarDays, barDaysHydrated] =
    usePersistentState<string>("graphs_barDays", "all");
  const [barDaysRange, setBarDaysRange] = React.useState<DateRange | undefined>();

  const [dayDays, setDayDays, dayDaysHydrated] =
    usePersistentState<string>("graphs_dayDays", "all");
  const [dayDaysRange, setDayDaysRange] = React.useState<DateRange | undefined>();
  const [dayMode, setDayMode, dayModeHydrated] =
    usePersistentState<"M" | "A">("graphs_dayMode", "M");
  const [dayFreq, setDayFreq, dayFreqHydrated] =
    usePersistentState<boolean>("graphs_dayFreq", true);

  const [lineStations, setLineStations, lineStationsHydrated] =
    usePersistentState<string>("graphs_lineStations", "87;212");
  const [lineDays, setLineDays, lineDaysHydrated] =
    usePersistentState<string>("graphs_lineDays", "all");
  const [lineDaysRange, setLineDaysRange] = React.useState<DateRange | undefined>();

  const [matsDelta, setMatsDelta, matsDeltaHydrated] =
    usePersistentState<string>("graphs_matsDelta", "60");
  const [matsStations1, setMatsStations1, matsStations1Hydrated] =
    usePersistentState<string>("graphs_matsStations1", "87;212");
  const [matsStations2, setMatsStations2, matsStations2Hydrated] =
    usePersistentState<string>("graphs_matsStations2", "0;1");
  const [matsMode, setMatsMode, matsModeHydrated] =
    usePersistentState<"M" | "A">("graphs_matsMode", "M");

  // API (not persisted)
  const [apiBusy, setApiBusy] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  const uiHydrated =
    seleccionHydrated &&
    chartsHydrated &&
    filterKindHydrated &&
    filterStateHydrated &&
    useFilterHydrated &&
    advancedHydrated &&
    deltaModeHydrated &&
    deltaValueHydrated &&
    advEntradaHydrated &&
    advSalidaHydrated &&
    barStationsHydrated &&
    barDaysHydrated &&
    dayDaysHydrated &&
    dayModeHydrated &&
    dayFreqHydrated &&
    lineStationsHydrated &&
    lineDaysHydrated &&
    matsDeltaHydrated &&
    matsStations1Hydrated &&
    matsStations2Hydrated &&
    matsModeHydrated;

  if (!uiHydrated) {
    return <div className="p-3 text-xs text-muted-foreground">Loading…</div>;
  }

  const handleAnalyze = async () => {
    if (apiBusy || selectedCharts.length === 0) return;

    if (!runId) {
      setApiError("Selecciona una simulación...");
      return;
    }

    setApiBusy(true);
    setApiError(null);

    try {
      await analyzeGraphs({
        runId,
        seleccionAgreg,
        selectedCharts,

        deltaMediaTxt,
        deltaAcumTxt,

        useFilter,
        filterKind,
        filterState,

        barStations,
        barDays,

        dayDays,
        dayMode,
        dayFreq,

        lineStations,
        lineDays,

        matsDelta,
        matsStations1,
        matsStations2,
        matsMode,
      });
    } catch (e: any) {
      setApiError(e?.message ?? "Error inesperado");
    } finally {
      setApiBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="graphs" className="w-full">
        <TabsList className="w-full justify-start flex-wrap">
          <TabsTrigger value="graphs">Graphs</TabsTrigger>
          <TabsTrigger value="filter">Filter</TabsTrigger>
          <TabsTrigger value="matrix">Matrix</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="graphs" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Graphs</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">


              <GraphsSelectorCard
                GRAFICAS={GRAFICAS}
                selectedCharts={selectedCharts}
                setSelectedCharts={setSelectedCharts}
                useFilter={useFilter}
                barStations={barStations}
                setBarStations={setBarStations}
                barDaysRange={barDaysRange}
                setBarDaysRange={setBarDaysRange}
                barDays={barDays}
                setBarDays={setBarDays}
                dayDaysRange={dayDaysRange}
                setDayDaysRange={setDayDaysRange}
                dayDays={dayDays}
                setDayDays={setDayDays}
                dayMode={dayMode}
                setDayMode={setDayMode}
                dayFreq={dayFreq}
                setDayFreq={setDayFreq}
                lineStations={lineStations}
                setLineStations={setLineStations}
                lineDaysRange={lineDaysRange}
                setLineDaysRange={setLineDaysRange}
                lineDays={lineDays}
                setLineDays={setLineDays}
                matsDelta={matsDelta}
                setMatsDelta={setMatsDelta}
                matsMode={matsMode}
                setMatsMode={setMatsMode}
                matsStations1={matsStations1}
                setMatsStations1={setMatsStations1}
                matsStations2={matsStations2}
                setMatsStations2={setMatsStations2}
                encodeRangeAsDayList={encodeRangeAsDayList}
              />

               <AdvancedControls
                advancedUser={advancedUser}
                setAdvancedUser={setAdvancedUser}
                deltaMode={deltaMode}
                setDeltaMode={setDeltaMode}
                deltaValueTxt={deltaValueTxt}
                setDeltaValueTxt={setDeltaValueTxt}
                advancedEntrada={advancedEntrada}
                setAdvancedEntrada={setAdvancedEntrada}
                advancedSalida={advancedSalida}
                setAdvancedSalida={setAdvancedSalida}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filter" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <MapsAndGraphsFilterControls
                useFilterForMaps={useFilter}
                setUseFilterForMaps={setUseFilter}
                filterKind={filterKind}
                setFilterKind={setFilterKind}
                filterState={filterState}
                setFilterState={setFilterState}
                daysRange={daysRange}
                setDaysRange={setDaysRange}
                dateDiffInDays={dateDiffInDays}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <MatrixSelect
                matrices={[...MATRICES]}
                seleccionAgreg={seleccionAgreg}
                setSeleccionAgreg={setSeleccionAgreg}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleAnalyze}
                disabled={apiBusy || selectedCharts.length === 0}
                className="w-full"
              >
                {apiBusy ? "Analizando…" : "Analizar gráficas"}
              </Button>

              {apiError && <span className="text-sm text-destructive">{apiError}</span>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
