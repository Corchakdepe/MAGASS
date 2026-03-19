import {useState, useEffect} from "react";
import type {ChartSeries} from "../types/analytics";

export function useChartData(initialSeries: ChartSeries[]) {
  const [series, setSeries] = useState<ChartSeries[]>(initialSeries);
  const [activeSeries, setActiveSeries] = useState<string[]>([]);

  const toggleSeries = (seriesName: string) => {
    setActiveSeries((prev) => {
      if (prev.includes(seriesName)) {
        return prev.filter((name) => name !== seriesName);
      }
      return [...prev, seriesName];
    });
  };

  const filteredSeries =
    activeSeries.length === 0
      ? series
      : series.filter((s) => activeSeries.includes(s.name));

  useEffect(() => {
    setSeries(initialSeries);
  }, [initialSeries]);

  return {
    series: filteredSeries,
    activeSeries,
    toggleSeries,
    allSeries: series,
  };
}
