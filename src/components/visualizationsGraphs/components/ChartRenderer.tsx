// src/components/visualizations/components/ChartRenderer.tsx

"use client";

import React from "react";
import {LineChart, BarChart} from "@mui/x-charts";
import {ChartAnalytics} from "@/components/ChartAnalytics";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ChartDataState } from "../types";

interface ChartRendererProps {
  chartData: ChartDataState;
  finalType: "bar" | "line" | "area";
  formattedXAxis: (string | number)[];
  xLabel: string;
  muiSeries: any[];
  valueFormatter: (value: number | null) => string;
}

export function ChartRenderer({
  chartData,
  finalType,
  formattedXAxis,
  xLabel,
  muiSeries,
  valueFormatter,
}: ChartRendererProps) {
  const { t } = useLanguage();

  if (!chartData || !chartData.x.length || !muiSeries.length) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-text-tertiary">
        {t("noNumericDataForGraph")}
      </div>
    );
  }

  const commonProps = {
    height: 320,
    xAxis: [
      {
        data: formattedXAxis as any,
        scaleType: "band" as const,
        label: xLabel,
      },
    ],
    slotProps: { legend: { hidden: false } },
  };

  if (finalType === "bar") {
    return (
      <BarChart
        {...commonProps}
        series={muiSeries.map((s) => ({ ...s, valueFormatter })) as any}
      />
    );
  }

  if (finalType === "area") {
    return (
      <LineChart
        {...commonProps}
        series={muiSeries.map((s) => ({
          ...s,
          valueFormatter,
          area: true,
        })) as any}
      />
    );
  }

  return (
    <LineChart
      {...commonProps}
      series={muiSeries.map((s) => ({ ...s, valueFormatter })) as any}
    />
  );
}
