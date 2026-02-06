// src/components/visualizations/types/analytics.ts

export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

export interface ChartConfig {
  type: "line" | "bar" | "scatter" | "area";
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  legend?: boolean;
  grid?: boolean;
}

export interface ChartAnalyticsProps {
  series: ChartSeries[];
  config: ChartConfig;
  height?: number;
  width?: number | string;
  onExport?: () => void;
}

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

/** NEW: trend */
export interface TrendMetrics {
  stationId: string;
  slope: number; // per x-step (index)
  intercept: number;
  r2: number; // 0..1
}

/** NEW: distribution shape */
export interface ShapeMetrics {
  stationId: string;
  skewness: number;
  kurtosis: number; // excess kurtosis (kurtosis - 3)
}

/** NEW: sparsity/activity */
export interface ActivityMetrics {
  stationId: string;
  zeroCount: number;
  nonZeroCount: number;
  nonZeroRatio: number; // 0..1
}

/** NEW: rolling stats */
export interface RollingMetrics {
  stationId: string;
  window: number;
  rollingStdDev: number[]; // aligned to original index
}

/** NEW: lag correlation (lead/lag) */
export interface LagCorrelation {
  station1: string;
  station2: string;
  bestLag: number; // + means station1 leads station2
  bestCorrelation: number;
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

  // NEW
  trends: TrendMetrics[];
  shapes: ShapeMetrics[];
  activity: ActivityMetrics[];
  rolling: RollingMetrics[];
  lagComparisons: LagCorrelation[];

  hasData: boolean;
}
