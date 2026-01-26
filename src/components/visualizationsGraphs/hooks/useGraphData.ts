// src/components/visualizations/hooks/useGraphData.ts

import { useState, useEffect } from "react";
import type { BackendChart, ChartDataState, GraphItem } from "../types";
import { buildChartData } from "../utils/chartDataBuilders";

export function useGraphData(
  selectedIndex: number,
  filteredGraphs: any[],
  jsonMode: boolean,
  chartsFromApi: BackendChart[] | undefined,
  fileMode: boolean,
  graphs: GraphItem[] | undefined,
  apiBase: string
) {
  const [content, setContent] = useState<BackendChart | null>(null);
  const [chartData, setChartData] = useState<ChartDataState>(null);

  useEffect(() => {
    const active: any = filteredGraphs[selectedIndex];

    console.log("=== useGraphData Debug ===");
    console.log("selectedIndex:", selectedIndex);
    console.log("active:", active);

    if (!active) {
      console.log("No active graph");
      setContent(null);
      setChartData(null);
      return;
    }

    const id = String(active.id);
    console.log("Graph ID:", id);

    const load = async () => {
      // FIX: Only use JSON mode if chartsFromApi has data
      if (jsonMode && chartsFromApi && chartsFromApi.length > 0) {
        console.log("JSON mode - searching in chartsFromApi");
        const chart = chartsFromApi.find((c) => String(c.id) === id);
        if (!chart) {
          console.warn("Chart not found in chartsFromApi");
          setContent(null);
          setChartData(null);
          return;
        }
        console.log("Found chart:", chart);
        setContent(chart);
        const data = buildChartData(chart);
        console.log("Built chart data:", data);
        setChartData(data);
        return;
      }

      // File mode: fetch from API
      if (!fileMode || !graphs) {
        console.log("Not in file mode or no graphs");
        setContent(null);
        setChartData(null);
        return;
      }

      const item = graphs.find((g) => String(g.id) === id);
      if (!item) {
        console.warn("Graph item not found in graphs array");
        setContent(null);
        setChartData(null);
        return;
      }

      console.log("Graph item found:", item);

      try {
        // Build URL - check both api_full_url and url
        const url = item.api_full_url ?? (item.url ? `${apiBase}/${item.url}` : "");

        console.log("Fetching from URL:", url);

        if (!url) {
          console.error("No valid URL for graph");
          setContent(null);
          setChartData(null);
          return;
        }

        const res = await fetch(url, { cache: "no-store" });

        if (!res.ok) {
          console.error(`Fetch failed: ${res.status} ${res.statusText}`);
          setContent(null);
          setChartData(null);
          return;
        }

        const json = (await res.json()) as BackendChart;
        console.log("Fetched JSON:", json);

        if (!json) {
          console.warn("Empty JSON response");
          setContent(null);
          setChartData(null);
          return;
        }

        // Set the ID from the active item
        json.id = id;

        console.log("Setting content:", json);
        setContent(json);

        const data = buildChartData(json);
        console.log("Built chart data:", data);
        setChartData(data);
      } catch (error) {
        console.error("Error loading chart:", error);
        setContent(null);
        setChartData(null);
      }
    };

    void load();
  }, [selectedIndex, filteredGraphs, jsonMode, chartsFromApi, fileMode, graphs, apiBase]);

  return { content, chartData };
}
