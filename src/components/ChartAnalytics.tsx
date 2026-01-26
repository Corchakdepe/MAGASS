"use client";

import React, { useMemo } from "react";
import { LineChart, BarChart } from "@mui/x-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import type { StandardizedChart, LegacyChart } from "@/components/visualizations/visualizationsGraphs";
import { useLanguage } from "@/contexts/LanguageContext";

// ============================================================
// STATISTICAL ANALYSIS UTILITIES
// ============================================================

interface SeriesStats {
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

interface ComparisonMetrics {
  station1: string;
  station2: string;
  correlation: number;
  mean_difference: number;
  max_divergence: number;
  max_divergence_hour: number;
}

interface VolatilityMetrics {
  stationId: string;
  hourly_changes: number[];
  max_increase: number;
  max_increase_hour: number;
  max_decrease: number;
  max_decrease_hour: number;
  avg_volatility: number;
}

interface AnomalyDetection {
  stationId: string;
  anomalies: Array<{
    hour: number;
    value: number;
    z_score: number;
    type: "high" | "low";
  }>;
}

/**
 * Calculate statistical metrics for a series
 */
function calculateSeriesStats(
  stationId: string,
  values: number[]
): SeriesStats {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;

  const variance =
    values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
    values.length;
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

/**
 * Calculate Pearson correlation between two series
 */
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

/**
 * Calculate comparison metrics between two stations
 */
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

/**
 * Calculate volatility metrics (hour-over-hour changes)
 */
function calculateVolatility(
  stationId: string,
  values: number[]
): VolatilityMetrics {
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

/**
 * Detect anomalies using Z-score method
 */
function detectAnomalies(
  stationId: string,
  values: number[],
  threshold: number = 2.5
): AnomalyDetection {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      values.length
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
// MAIN ANALYTICS COMPONENT
// ============================================================

interface ChartAnalyticsProps {
  chart: StandardizedChart | LegacyChart;
}

export function ChartAnalytics({ chart }: ChartAnalyticsProps) {
  const { t } = useLanguage();

  // Extract series data
  const seriesData = useMemo(() => {
    if ("data" in chart && chart.data) {
      return chart.data.series.map((s) => ({
        id: s.id,
        label: s.label,
        values: s.values,
      }));
    } else if ("series" in chart && chart.series) {
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

  if (seriesData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-text-secondary font-body">
        {t("noDataAvailable")}
      </div>
    );
  }

  return (
    <div className="space-y-4 font-body">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-surface-2 p-1 rounded-lg">
          <TabsTrigger
            value="overview"
            className="text-xs font-medium text-text-secondary data-[state=active]:bg-surface-1 data-[state=active]:text-accent data-[state=active]:shadow-mac-panel rounded-md transition-all"
          >
            {t("overview")}
          </TabsTrigger>
          <TabsTrigger
            value="comparison"
            className="text-xs font-medium text-text-secondary data-[state=active]:bg-surface-1 data-[state=active]:text-accent data-[state=active]:shadow-mac-panel rounded-md transition-all"
          >
            {t("comparison")}
          </TabsTrigger>
          <TabsTrigger
            value="volatility"
            className="text-xs font-medium text-text-secondary data-[state=active]:bg-surface-1 data-[state=active]:text-accent data-[state=active]:shadow-mac-panel rounded-md transition-all"
          >
            {t("volatility")}
          </TabsTrigger>
          <TabsTrigger
            value="anomalies"
            className="text-xs font-medium text-text-secondary data-[state=active]:bg-surface-1 data-[state=active]:text-accent data-[state=active]:shadow-mac-panel rounded-md transition-all"
          >
            {t("anomalies")}
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="text-xs font-medium text-text-secondary data-[state=active]:bg-surface-1 data-[state=active]:text-accent data-[state=active]:shadow-mac-panel rounded-md transition-all"
          >
            {t("performance")}
          </TabsTrigger>
        </TabsList>

        {/* ========== TAB 1: OVERVIEW ========== */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statistics.map((stat) => (
              <Card
                key={stat.stationId}
                className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden"
              >
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold text-text-primary font-headline">
                    {stat.stationId}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-4 pb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{t("mean")}</span>
                    <span className="font-semibold text-text-primary">{stat.mean.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{t("range")}</span>
                    <span className="font-semibold text-text-primary">
                      {stat.min.toFixed(1)} - {stat.max.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{t("stdDev")}</span>
                    <span className="font-semibold text-text-primary">{stat.stdDev.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{t("peakHour")}</span>
                    <Badge
                      variant="outline"
                      className="bg-accent-soft text-accent border-accent/20 font-medium"
                    >
                      {String(stat.peak_hour).padStart(2, "0")}:00
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{t("cv")}</span>
                    <span
                      className={
                        stat.coefficient_of_variation > 30
                          ? "text-warning font-semibold"
                          : "font-semibold text-text-primary"
                      }
                    >
                      {stat.coefficient_of_variation.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Rankings Table */}
          <Card className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden">
            <CardHeader className="px-4 pt-4 pb-3">
              <CardTitle className="text-base font-semibold text-text-primary font-headline">
                {t("stationRankings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-3">
                      <th className="text-left py-2 text-xs font-medium text-text-secondary">
                        {t("rank")}
                      </th>
                      <th className="text-left py-2 text-xs font-medium text-text-secondary">
                        {t("station")}
                      </th>
                      <th className="text-right py-2 text-xs font-medium text-text-secondary">
                        {t("mean")}
                      </th>
                      <th className="text-right py-2 text-xs font-medium text-text-secondary">
                        {t("max")}
                      </th>
                      <th className="text-right py-2 text-xs font-medium text-text-secondary">
                        {t("total")}
                      </th>
                      <th className="text-right py-2 text-xs font-medium text-text-secondary">
                        {t("stability")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((rank) => (
                      <tr key={rank.stationId} className="border-b border-surface-3">
                        <td className="py-2">
                          <Badge
                            variant={rank.rank === 1 ? "default" : "outline"}
                            className={rank.rank === 1 ? "bg-accent text-white border-accent" : "border-surface-3 text-text-secondary"}
                          >
                            #{rank.rank}
                          </Badge>
                        </td>
                        <td className="py-2 font-medium text-text-primary">{rank.stationId}</td>
                        <td className="py-2 text-right text-text-primary">{rank.mean.toFixed(2)}</td>
                        <td className="py-2 text-right text-text-primary">{rank.max.toFixed(2)}</td>
                        <td className="py-2 text-right text-text-primary">{rank.total.toFixed(0)}</td>
                        <td className="py-2 text-right">
                          <span
                            className={
                              rank.coefficient_of_variation < 20
                                ? "text-success font-medium"
                                : rank.coefficient_of_variation > 40
                                ? "text-warning font-medium"
                                : "text-text-primary"
                            }
                          >
                            {(100 - rank.coefficient_of_variation).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB 2: COMPARISON ========== */}
        <TabsContent value="comparison" className="space-y-4 mt-4">
          {comparisons.length > 0 ? (
            <>
              {/* Correlation Matrix */}
              <Card className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden">
                <CardHeader className="px-4 pt-4 pb-3">
                  <CardTitle className="text-base font-semibold text-text-primary font-headline">
                    {t("pairwiseCorrelations")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-3">
                    {comparisons.map((comp, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-surface-0 border border-surface-3"
                      >
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {comp.station1} ↔ {comp.station2}
                          </div>
                          <div className="text-xs text-text-secondary mt-1">
                            {t("meanDiff")}: {comp.mean_difference.toFixed(2)} · {t("maxDivergence")} {comp.max_divergence_hour}:00
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              Math.abs(comp.correlation) > 0.7
                                ? "default"
                                : "outline"
                            }
                            className={
                              Math.abs(comp.correlation) > 0.7
                                ? "bg-accent text-white border-accent"
                                : "border-surface-3 text-text-secondary"
                            }
                          >
                            r = {comp.correlation.toFixed(3)}
                          </Badge>
                          {comp.correlation > 0.7 ? (
                            <TrendingUp className="h-4 w-4 text-success" />
                          ) : comp.correlation < -0.7 ? (
                            <TrendingDown className="h-4 w-4 text-danger" />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Difference Chart */}
              <Card className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden">
                <CardHeader className="px-4 pt-4 pb-3">
                  <CardTitle className="text-base font-semibold text-text-primary font-headline">
                    {t("hourByHourDifferences")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {comparisons.length > 0 && seriesData.length >= 2 && (
                    <LineChart
                      height={300}
                      xAxis={[
                        {
                          data: Array.from({ length: 24 }, (_, i) => i),
                          scaleType: "band",
                          label: t("hour"),
                        },
                      ]}
                      series={[
                        {
                          id: "difference",
                          label: `${comparisons[0].station1} - ${comparisons[0].station2}`,
                          data: seriesData[0].values.map(
                            (v, i) => v - seriesData[1].values[i]
                          ),
                          area: true,
                          color: "rgba(0,122,255,0.6)",
                        },
                      ]}
                    />
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden">
              <CardContent className="py-8 text-center text-text-secondary">
                {t("needTwoStations")}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ========== TAB 3: VOLATILITY ========== */}
        <TabsContent value="volatility" className="space-y-4 mt-4">
          {/* Volatility Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {volatility.map((vol) => (
              <Card
                key={vol.stationId}
                className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden"
              >
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold text-text-primary font-headline">
                    {vol.stationId}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-4 pb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{t("maxIncrease")}</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-success" />
                      <span className="font-semibold text-success">
                        +{vol.max_increase.toFixed(2)} {t("at")}{" "}
                        {vol.max_increase_hour}:00
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{t("maxDecrease")}</span>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-3 w-3 text-danger" />
                      <span className="font-semibold text-danger">
                        {vol.max_decrease.toFixed(2)} {t("at")}{" "}
                        {vol.max_decrease_hour}:00
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{t("avgVolatility")}</span>
                    <span className="font-semibold text-text-primary">
                      {vol.avg_volatility.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Hour-over-Hour Changes Chart */}
          <Card className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden">
            <CardHeader className="px-4 pt-4 pb-3">
              <CardTitle className="text-base font-semibold text-text-primary font-headline">
                {t("hourOverHourChanges")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <BarChart
                height={300}
                xAxis={[
                  {
                    data: Array.from({ length: 23 }, (_, i) => i + 1),
                    scaleType: "band",
                    label: t("hourTransition"),
                  },
                ]}
                series={volatilityChartData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB 4: ANOMALIES ========== */}
        <TabsContent value="anomalies" className="space-y-4 mt-4">
          {anomalies.map((anom) => (
            <Card
              key={anom.stationId}
              className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden"
            >
              <CardHeader className="px-4 pt-4 pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold font-headline">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-text-primary">
                    {anom.stationId} - {anom.anomalies.length} {t("anomaliesDetected")}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {anom.anomalies.length > 0 ? (
                  <div className="space-y-2">
                    {anom.anomalies.map((a, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          a.type === "high"
                            ? "bg-warning-soft border-warning/20"
                            : "bg-accent-soft border-accent/20"
                        }`}
                      >
                        <div className="text-sm">
                          <span className="font-medium text-text-primary">
                            {t("hour")} {String(a.hour).padStart(2, "0")}:00
                          </span>
                          <span className="text-text-secondary ml-2">
                            {t("value")}: {a.value.toFixed(2)}
                          </span>
                        </div>
                        <Badge
                          variant={a.type === "high" ? "destructive" : "secondary"}
                          className={
                            a.type === "high"
                              ? "bg-danger text-white border-danger"
                              : "bg-accent text-white border-accent"
                          }
                        >
                          Z-score: {a.z_score.toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-text-secondary">
                    {t("noAnomalies")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ========== TAB 5: PERFORMANCE ========== */}
        <TabsContent value="performance" className="space-y-4 mt-4">
          {/* Performance Overview with Area Chart */}
          <Card className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden">
            <CardHeader className="px-4 pt-4 pb-3">
              <CardTitle className="text-base font-semibold text-text-primary font-headline">
                {t("performanceTrends")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <LineChart
                height={300}
                xAxis={[
                  {
                    data: Array.from({ length: 24 }, (_, i) => i),
                    scaleType: "band",
                    label: t("hour"),
                  },
                ]}
                series={seriesData.map((s) => ({
                  id: s.id,
                  label: s.label,
                  data: s.values,
                  area: true,
                  stack: "total",
                }))}
              />
            </CardContent>
          </Card>

          {/* Capacity Utilization */}
          <Card className="bg-surface-1 border border-surface-3 shadow-mac-panel rounded-lg overflow-hidden">
            <CardHeader className="px-4 pt-4 pb-3">
              <CardTitle className="text-base font-semibold text-text-primary font-headline">
                {t("capacityUtilization")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                {performanceMetrics.map((perf) => (
                  <div key={perf.station}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary">{perf.station}</span>
                      <span className="text-xs text-text-secondary">
                        {perf.capacity.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-surface-2 rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, perf.capacity)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
