"use client";

import { useMemo } from "react";
import type { StandardizedChart, LegacyChart } from "@/components/visualizationsGraphs/types";

// ============================================================
// TYPES
// ============================================================

export interface SeriesStats {
  stationId: string;
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  range: number;
  coefficient_of_variation: number;
  peak_hour: number;
  valley_hour: number;
  total: number;
}

export interface ComparisonMetrics {
  station1: string;
  station2: string;
  correlation: number;
  mean_difference: number;
  max_divergence: number;
  max_divergence_hour: number;
}

export interface VolatilityMetrics {
  stationId: string;
  hourly_changes: number[];
  max_increase: number;
  max_increase_hour: number;
  max_decrease: number;
  max_decrease_hour: number;
  avg_volatility: number;
}

export interface AnomalyDetection {
  stationId: string;
  anomalies: Array<{
    hour: number;
    value: number;
    z_score: number;
    type: "high" | "low";
  }>;
}

export interface SeriesDatum {
  id: string;
  label: string;
  values: number[];
}

export interface RankedSeriesStats extends SeriesStats {
  rank: number;
}

export interface PerformanceMetric {
  station: string;
  peak: number;
  average: number;
  stability: number; // 100 - CV
  capacity: number; // mean/max * 100
}

export interface VolatilityChartSeries {
  id: string;
  label: string;
  data: number[];
}

export interface UseChartAnalysisResult {
  seriesData: SeriesDatum[];
  statistics: SeriesStats[];
  rankings: RankedSeriesStats[];
  comparisons: ComparisonMetrics[];
  volatility: VolatilityMetrics[];
  volatilityChartData: VolatilityChartSeries[];
  anomalies: AnomalyDetection[];
  performanceMetrics: PerformanceMetric[];
  hasData: boolean;
}

// ============================================================
// PURE UTILITIES (moved from component)
// ============================================================

function calculateSeriesStats(stationId: string, values: number[]): SeriesStats {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;

  const variance =
    values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const median =
    values.length % 2 === 0
      ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
      : sorted[Math.floor(values.length / 2)];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const peak_hour = values.indexOf(max);
  const valley_hour = values.indexOf(min);

  return {
    stationId,
    min,
    max,
    mean,
    median,
    stdDev,
    variance,
    range: max - min,
    coefficient_of_variation: (stdDev / mean) * 100,
    peak_hour,
    valley_hour,
    total: sum,
  };
}

function calculateCorrelation(series1: number[], series2: number[]): number {
  const n = Math.min(series1.length, series2.length);
  const mean1 = series1.reduce((a, b) => a + b, 0) / n;
  const mean2 = series2.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let sum1 = 0;
  let sum2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = series1[i] - mean1;
    const diff2 = series2[i] - mean2;
    numerator += diff1 * diff2;
    sum1 += diff1 * diff1;
    sum2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(sum1 * sum2);
  return denominator === 0 ? 0 : numerator / denominator;
}

function calculateComparison(
  station1: string,
  values1: number[],
  station2: string,
  values2: number[]
): ComparisonMetrics {
  const correlation = calculateCorrelation(values1, values2);

  const differences = values1.map((v, i) => Math.abs(v - values2[i]));
  const max_divergence = Math.max(...differences);
  const max_divergence_hour = differences.indexOf(max_divergence);

  const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
  const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
  const mean_difference = mean1 - mean2;

  return {
    station1,
    station2,
    correlation,
    mean_difference,
    max_divergence,
    max_divergence_hour,
  };
}

function calculateVolatility(stationId: string, values: number[]): VolatilityMetrics {
  const hourly_changes = values.slice(1).map((v, i) => v - values[i]);

  const max_increase = Math.max(...hourly_changes);
  const max_increase_hour = hourly_changes.indexOf(max_increase) + 1;

  const max_decrease = Math.min(...hourly_changes);
  const max_decrease_hour = hourly_changes.indexOf(max_decrease) + 1;

  const avg_volatility =
    hourly_changes.reduce((a, b) => a + Math.abs(b), 0) / hourly_changes.length;

  return {
    stationId,
    hourly_changes,
    max_increase,
    max_increase_hour,
    max_decrease,
    max_decrease_hour,
    avg_volatility,
  };
}

function detectAnomalies(
  stationId: string,
  values: number[],
  threshold: number = 2.5
): AnomalyDetection {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
  );

  const anomalies = values
    .map((value, hour) => {
      const z_score = (value - mean) / stdDev;
      if (Math.abs(z_score) > threshold) {
        return {
          hour,
          value,
          z_score,
          type: z_score > 0 ? ("high" as const) : ("low" as const),
        };
      }
      return null;
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  return { stationId, anomalies };
}

// ============================================================
// HOOK
// ============================================================

export function useChartAnalysis(chart: StandardizedChart | LegacyChart): UseChartAnalysisResult {
  const seriesData = useMemo<SeriesDatum[]>(() => {
    if ("data" in chart && chart.data) {
      return chart.data.series.map((s) => ({
        id: s.id,
        label: s.label,
        values: s.values,
      }));
    }
    if ("series" in chart && chart.series) {
      return Object.entries(chart.series).map(([id, values]) => ({
        id,
        label: id,
        values: values as number[],
      }));
    }
    return [];
  }, [chart]);

  const statistics = useMemo(() => {
    return seriesData.map((s) => calculateSeriesStats(s.id, s.values));
  }, [seriesData]);

  const comparisons = useMemo(() => {
    const results: ComparisonMetrics[] = [];
    for (let i = 0; i < seriesData.length; i++) {
      for (let j = i + 1; j < seriesData.length; j++) {
        results.push(
          calculateComparison(
            seriesData[i].id,
            seriesData[i].values,
            seriesData[j].id,
            seriesData[j].values
          )
        );
      }
    }
    return results;
  }, [seriesData]);

  const volatility = useMemo(() => {
    return seriesData.map((s) => calculateVolatility(s.id, s.values));
  }, [seriesData]);

  const anomalies = useMemo(() => {
    return seriesData.map((s) => detectAnomalies(s.id, s.values, 2.0));
  }, [seriesData]);

  const volatilityChartData = useMemo(() => {
    return volatility.map((v) => ({
      id: v.stationId,
      label: v.stationId,
      data: v.hourly_changes,
    }));
  }, [volatility]);

  const rankings = useMemo(() => {
    return [...statistics]
      .sort((a, b) => b.mean - a.mean)
      .map((stat, index) => ({ ...stat, rank: index + 1 }));
  }, [statistics]);

  const performanceMetrics = useMemo(() => {
    return statistics.map((stat) => ({
      station: stat.stationId,
      peak: stat.max,
      average: stat.mean,
      stability: 100 - stat.coefficient_of_variation,
      capacity: (stat.mean / stat.max) * 100,
    }));
  }, [statistics]);

  return {
    seriesData,
    statistics,
    rankings,
    comparisons,
    volatility,
    volatilityChartData,
    anomalies,
    performanceMetrics,
    hasData: seriesData.length > 0,
  };
}
