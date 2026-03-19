"use client";

import { useMemo } from "react";
import type { StandardizedChart, LegacyChart } from "@/components/visualizationsGraphs/types";

import type {
  ActivityMetrics,
  AnomalyDetection,
  ComparisonMetrics,
  LagCorrelation,
  RollingMetrics,
  SeriesDatum,
  SeriesStats,
  ShapeMetrics,
  TrendMetrics,
  UseChartAnalysisResult,
  VolatilityMetrics,
} from "../types/analytics";

// --------------------------
// Base stats
// --------------------------
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
    coefficient_of_variation: mean === 0 ? 0 : (stdDev / mean) * 100,
    peak_hour,
    valley_hour,
    total: sum,
  };
}

function calculateCorrelation(series1: number[], series2: number[]): number {
  const n = Math.min(series1.length, series2.length);
  if (n <= 1) return 0;

  const mean1 = series1.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const mean2 = series2.slice(0, n).reduce((a, b) => a + b, 0) / n;

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
  const n = Math.min(values1.length, values2.length);
  const v1 = values1.slice(0, n);
  const v2 = values2.slice(0, n);

  const correlation = calculateCorrelation(v1, v2);

  const differences = v1.map((v, i) => Math.abs(v - v2[i]));
  const max_divergence = differences.length ? Math.max(...differences) : 0;
  const max_divergence_hour = differences.indexOf(max_divergence);

  const mean1 = v1.reduce((a, b) => a + b, 0) / (v1.length || 1);
  const mean2 = v2.reduce((a, b) => a + b, 0) / (v2.length || 1);

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
  if (values.length < 2) {
    return {
      stationId,
      hourly_changes: [],
      max_increase: 0,
      max_increase_hour: 0,
      max_decrease: 0,
      max_decrease_hour: 0,
      avg_volatility: 0,
    };
  }

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
  const n = values.length;
  if (n === 0) return { stationId, anomalies: [] };

  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / n;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return { stationId, anomalies: [] };

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

// --------------------------
// NEW: Trend, shape, activity, rolling, lag correlation
// --------------------------
function calculateTrend(stationId: string, values: number[]): TrendMetrics {
  const n = values.length;
  if (n < 2) return { stationId, slope: 0, intercept: values[0] ?? 0, r2: 0 };

  let sumX = 0,
    sumY = 0,
    sumXX = 0,
    sumXY = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXX += i * i;
    sumXY += i * values[i];
  }

  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const y = values[i];
    const yHat = slope * i + intercept;
    ssTot += (y - meanY) * (y - meanY);
    ssRes += (y - yHat) * (y - yHat);
  }

  const r2 = ssTot === 0 ? 0 : Math.max(0, Math.min(1, 1 - ssRes / ssTot));
  return { stationId, slope, intercept, r2 };
}

function calculateShape(stationId: string, values: number[]): ShapeMetrics {
  const n = values.length;
  if (n < 3) return { stationId, skewness: 0, kurtosis: 0 };

  const mean = values.reduce((a, b) => a + b, 0) / n;

  let m2 = 0,
    m3 = 0,
    m4 = 0;

  for (const v of values) {
    const d = v - mean;
    const d2 = d * d;
    m2 += d2;
    m3 += d2 * d;
    m4 += d2 * d2;
  }

  m2 /= n;
  m3 /= n;
  m4 /= n;

  if (m2 === 0) return { stationId, skewness: 0, kurtosis: 0 };

  const skewness = m3 / Math.pow(m2, 1.5);
  const kurtosis = m4 / (m2 * m2) - 3;

  return { stationId, skewness, kurtosis };
}

function calculateActivity(stationId: string, values: number[]): ActivityMetrics {
  let zeroCount = 0;
  for (const v of values) if (v === 0) zeroCount++;

  const nonZeroCount = values.length - zeroCount;
  return {
    stationId,
    zeroCount,
    nonZeroCount,
    nonZeroRatio: values.length ? nonZeroCount / values.length : 0,
  };
}

function rollingStd(values: number[], window: number): number[] {
  const n = values.length;
  if (window <= 1) return new Array(n).fill(0);

  const out = new Array<number>(n).fill(0);

  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    const m = slice.reduce((a, b) => a + b, 0) / slice.length;
    const v = slice.reduce((a, b) => a + (b - m) * (b - m), 0) / slice.length;
    out[i] = Math.sqrt(v);
  }

  return out;
}

function correlationAtLag(a: number[], b: number[], lag: number): number {
  // lag > 0: a[i] aligned with b[i+lag]
  const startA = Math.max(0, -lag);
  const startB = Math.max(0, lag);
  const n = Math.min(a.length - startA, b.length - startB);
  if (n <= 2) return 0;
  return calculateCorrelation(a.slice(startA, startA + n), b.slice(startB, startB + n));
}

function bestLagCorrelation(
  station1: string,
  values1: number[],
  station2: string,
  values2: number[],
  maxLag = 6
): LagCorrelation {
  let bestLag = 0;
  let bestCorrelation = -Infinity;

  for (let lag = -maxLag; lag <= maxLag; lag++) {
    const c = correlationAtLag(values1, values2, lag);
    if (c > bestCorrelation) {
      bestCorrelation = c;
      bestLag = lag;
    }
  }

  return {
    station1,
    station2,
    bestLag,
    bestCorrelation: bestCorrelation === -Infinity ? 0 : bestCorrelation,
  };
}

// ============================================================
// HOOK
// ============================================================
export function useChartAnalysis(chart: StandardizedChart | LegacyChart): UseChartAnalysisResult {
  const seriesData = useMemo<SeriesDatum[]>(() => {
    if ("data" in chart && (chart as any).data) {
      const c = chart as StandardizedChart;
      return c.data.series.map((s) => ({
        id: s.id,
        label: s.label,
        values: s.values,
      }));
    }

    if ("series" in chart && (chart as any).series) {
      const c = chart as LegacyChart;
      return Object.entries(c.series).map(([id, values]) => ({
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
      capacity: stat.max === 0 ? 0 : (stat.mean / stat.max) * 100,
    }));
  }, [statistics]);

  // NEW blocks
  const trends = useMemo(() => {
    return seriesData.map((s) => calculateTrend(s.id, s.values));
  }, [seriesData]);

  const shapes = useMemo(() => {
    return seriesData.map((s) => calculateShape(s.id, s.values));
  }, [seriesData]);

  const activity = useMemo(() => {
    return seriesData.map((s) => calculateActivity(s.id, s.values));
  }, [seriesData]);

  const rolling = useMemo<RollingMetrics[]>(() => {
    const window = 6;
    return seriesData.map((s) => ({
      stationId: s.id,
      window,
      rollingStdDev: rollingStd(s.values, window),
    }));
  }, [seriesData]);

  const lagComparisons = useMemo<LagCorrelation[]>(() => {
    const results: LagCorrelation[] = [];
    const maxLag = 6;
    for (let i = 0; i < seriesData.length; i++) {
      for (let j = i + 1; j < seriesData.length; j++) {
        results.push(
          bestLagCorrelation(
            seriesData[i].id,
            seriesData[i].values,
            seriesData[j].id,
            seriesData[j].values,
            maxLag
          )
        );
      }
    }
    return results;
  }, [seriesData]);

  return {
    seriesData,
    statistics,
    rankings,
    comparisons,
    volatility,
    volatilityChartData,
    anomalies,
    performanceMetrics,

    trends,
    shapes,
    activity,
    rolling,
    lagComparisons,

    hasData: seriesData.length > 0,
  };
}
