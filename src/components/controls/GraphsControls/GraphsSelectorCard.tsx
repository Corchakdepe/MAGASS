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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest font-bold text-text-tertiary">
            {t('graphs')}
          </div>
        </div>

        {useFilter && (
          <div className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent border border-accent/20">
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
        <div className="space-y-4 pt-1">
          {/* Bar Chart Configuration */}
          {showBarChart && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
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
            </div>
          )}

          {/* Day Chart Configuration */}
          {showDayChart && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
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
            </div>
          )}

          {/* Line Chart Configuration */}
          {showLineChart && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
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
            </div>
          )}

          {/* Matrix Comparison Configuration */}
          {showMatrixChart && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
