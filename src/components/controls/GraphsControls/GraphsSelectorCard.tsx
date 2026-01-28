"use client";

import * as React from "react";
import {GraphTypeSelector} from "./components/GraphTypeSelector";
import {BarChartConfig} from "./components/BarChartConfig";
import {DayChartConfig} from "./components/DayChartConfig";
import {LineChartConfig} from "./components/LineChartConfig";
import {MatrixComparisonConfig} from "./components/MatrixComparisonConfig";
import {useLanguage} from "@/contexts/LanguageContext";
import type {GraphsSelectorCardProps} from "./types/graphControls";

export type {GraphsSelectorCardProps, GraphKey, GraphOption} from "./types/graphControls";

export function GraphsSelectorCard(props: GraphsSelectorCardProps) {
  const {t} = useLanguage();
  const {
    GRAFICAS,
    selectedCharts,
    setSelectedCharts,
    useFilter,
    barStations,
    setBarStations,
    barDaysRange,
    setBarDaysRange,
    barDays,
    setBarDays,
    dayDaysRange,
    setDayDaysRange,
    dayDays,
    setDayDays,
    dayMode,
    setDayMode,
    dayFreq,
    setDayFreq,
    lineStations,
    setLineStations,
    lineDaysRange,
    setLineDaysRange,
    lineDays,
    setLineDays,
    matsDelta,
    setMatsDelta,
    matsMode,
    setMatsMode,
    matsStations1,
    setMatsStations1,
    matsStations2,
    setMatsStations2,
    encodeRangeAsDayList,
  } = props;

  // Determine which config sections to show
  const showBarChart = selectedCharts.some((c) =>
    ["graf_barras_est_med", "graf_barras_est_acum"].includes(c)
  );
  const showDayChart = selectedCharts.includes("graf_barras_dia");
  const showLineChart = selectedCharts.includes("graf_linea_comp_est");
  const showMatrixChart = selectedCharts.includes("graf_linea_comp_mats");

  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-3 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-text-primary">{t('graphs')}</div>
          <div className="text-[11px] text-text-secondary">
            {t('selectGraphsAndAdjust')}
          </div>
        </div>

        {useFilter && (
          <div className="shrink-0 rounded-md bg-accent-soft px-2 py-1 text-[11px] text-accent">
            {t('activeFilter')}
          </div>
        )}
      </div>

      {/* Graph Type Selection */}
      <GraphTypeSelector
        options={GRAFICAS}
        selected={selectedCharts}
        onChange={setSelectedCharts}
      />

      {/* Configuration sections for selected graphs */}
      {selectedCharts.length > 0 && (
        <div className="space-y-3">
          {/* Bar Chart Configuration */}
          {showBarChart && (
            <BarChartConfig
              stations={barStations}
              onStationsChange={setBarStations}
              daysRange={barDaysRange}
              onDaysRangeChange={setBarDaysRange}
              days={barDays}
              onDaysChange={setBarDays}
              encodeRangeAsDayList={encodeRangeAsDayList}
              useFilter={useFilter}
            />
          )}

          {/* Day Chart Configuration */}
          {showDayChart && (
            <DayChartConfig
              daysRange={dayDaysRange}
              onDaysRangeChange={setDayDaysRange}
              days={dayDays}
              onDaysChange={setDayDays}
              mode={dayMode}
              onModeChange={setDayMode}
              freq={dayFreq}
              onFreqChange={setDayFreq}
              encodeRangeAsDayList={encodeRangeAsDayList}
            />
          )}

          {/* Line Chart Configuration */}
          {showLineChart && (
            <LineChartConfig
              stations={lineStations}
              onStationsChange={setLineStations}
              daysRange={lineDaysRange}
              onDaysRangeChange={setLineDaysRange}
              days={lineDays}
              onDaysChange={setLineDays}
              encodeRangeAsDayList={encodeRangeAsDayList}
              useFilter={useFilter}
            />
          )}

          {/* Matrix Comparison Configuration */}
          {showMatrixChart && (
            <MatrixComparisonConfig
              delta={matsDelta}
              onDeltaChange={setMatsDelta}
              mode={matsMode}
              onModeChange={setMatsMode}
              stations1={matsStations1}
              onStations1Change={setMatsStations1}
              stations2={matsStations2}
              onStations2Change={setMatsStations2}
            />
          )}
        </div>
      )}
    </div>
  );
}
