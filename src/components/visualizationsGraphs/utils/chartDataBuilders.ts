// src/components/visualizations/utils/chartDataBuilders.ts

import type { StandardizedChart, LegacyChart, ChartDataState } from "../types";

export function isStandardizedChart(chart: any): chart is StandardizedChart {
  return (
    "data" in chart &&
    chart.data !== undefined &&
    typeof chart.data === "object" &&
    "x" in chart.data &&
    "series" in chart.data
  );
}

export function isLegacyChart(chart: any): chart is LegacyChart {
  return (
    "x" in chart &&
    Array.isArray(chart.x) &&
    "series" in chart &&
    typeof chart.series === "object" &&
    !("data" in chart)
  );
}

export function buildStandardizedChartData(chart: StandardizedChart): ChartDataState {
  const { data } = chart;

  const series = data.series.map((s) => ({
    key: s.id,
    label: s.label,
    data: s.values,
    derived: s.metadata.derived,
  }));

  return {
    x: data.x.values,
    series,
  };
}

export function buildLegacyChartData(chart: LegacyChart): ChartDataState {
  if (!chart || !chart.x || !chart.series) return null;

  const x = chart.x;
  const keys = Object.keys(chart.series);
  if (!keys.length) return null;

  const base: Exclude<ChartDataState, null> = {
    x,
    series: keys.map((k) => ({
      key: k,
      label: k,
      data: (chart.series[k] ?? []).map((v) => Number(v)),
    })),
  };

  const hasTotal = keys.includes("total");
  const hasCount = keys.includes("count");

  if (hasTotal && hasCount) {
    const total = (chart.series["total"] ?? []).map((v) => Number(v));
    const count = (chart.series["count"] ?? []).map((v) => Number(v));
    const avg = total.map((v, i) => (count[i] ? v / count[i] : 0));

    base.series.push({
      key: "avg",
      label: "avg (total / count)",
      data: avg,
      derived: true,
    });
  }

  if (base.series.length === 1) {
    const s = base.series[0];
    const cum: number[] = [];
    let acc = 0;
    for (const v of s.data) {
      acc += v;
      cum.push(acc);
    }

    base.series.push({
      key: `${s.key}_cumulative`,
      label: `${s.label} (cumulative)`,
      data: cum,
      derived: true,
    });
  }

  return base;
}

export function buildChartData(chart: any): ChartDataState {
  if (isStandardizedChart(chart)) {
    return buildStandardizedChartData(chart);
  }

  if (isLegacyChart(chart)) {
    return buildLegacyChartData(chart);
  }

  return null;
}
