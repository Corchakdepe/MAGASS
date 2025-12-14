// components/visualization-graphs.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import type { GraphItem } from '@/components/visualizations-panel';
import { ChartSpline } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title
);

type BackendChart = {
  id: string;
  kind: 'graph' | 'heatmap' | string;
  format: 'json' | string;
  x: (number | string)[];
  series: Record<string, number[]>;
  meta?: {
    type?: 'bar' | 'line' | string;
    title?: string;
    xLabel?: string;
    yLabel?: string;
    freq?: boolean;
    media?: boolean;
    [k: string]: any;
  };
};

type ChartDataState =
  | {
      labels: (string | number)[];
      datasets: { label: string; data: number[]; backgroundColor: string }[];
    }
  | null;

type VisualizationGraphsProps = {
  runId: string;
  apiBase: string;
  graphs?: GraphItem[]; // file mode (JSON files)
  chartsFromApi?: BackendChart[]; // direct API JSON mode
};

// ---------- helpers ----------

const roundNumber = (v: number, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(v * factor) / factor;
};

const backendChartToChartJs = (chart: BackendChart): ChartDataState => {
  const labels = chart.x.map((x) => (typeof x === 'number' ? roundNumber(x) : x));

  const keys = Object.keys(chart.series);
  if (keys.length === 0) return null;

  const baseColors = [
    'rgba(54,162,235,0.7)',
    'rgba(255,99,132,0.7)',
    'rgba(75,192,192,0.7)',
    'rgba(255,206,86,0.7)',
  ];

  const datasets = keys.map((k, idx) => ({
    label: k,
    data: chart.series[k] ?? [],
    backgroundColor: baseColors[idx % baseColors.length],
  }));

  return { labels, datasets };
};

const makeHistogramYScale = (values: number[]) => {
  if (!values.length) return { beginAtZero: true as const };

  const max = Math.max(...values);
  return {
    beginAtZero: true as const,
    min: 0,
    max: max * 1.05,
    ticks: {
      stepSize: Math.max(1, Math.round(max / 8)),
      callback: (v: any) => (Number.isInteger(v) ? v : ''),
    },
  };
};

const makeTimeSeriesYScale = (values: number[]) => {
  if (!values.length) return { beginAtZero: true as const };

  const max = Math.max(...values);
  const min = Math.min(...values);

  return {
    beginAtZero: min >= 0,
    min: min >= 0 ? 0 : min,
    max: max * 1.1,
  };
};

const prettyGraphLabel = (item: any) => {
  const raw = 'name' in item && item.name ? String(item.name) : String(item.id);

  let s = raw.replace(/\.[^/.]+$/, '');
  s = s.replace(/^\d{8}_\d{6}_/, '');
  s = s.replace(/_/g, ' ');

  return s.trim();
};

export default function VisualizationGraphs(props: VisualizationGraphsProps) {
  const fileMode = !!(props as any).graphs;
  const jsonMode = !!(props as any).chartsFromApi;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [content, setContent] = useState<string | object>('');
  const [chartData, setChartData] = useState<ChartDataState>(null);

  // ✅ cache titles per id so the left list can show titles
  const [titlesById, setTitlesById] = useState<Record<string, string>>({});

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    setChartData(null);
    setContent('');

    // API JSON mode: already BackendChart[]
    if (jsonMode && (props as any).chartsFromApi) {
      const chartsFromApi = (props as any).chartsFromApi as BackendChart[];
      const chart = chartsFromApi.find((c) => c.id === id);
      if (!chart) return;

      const apiTitle = chart.meta?.title;
      if (typeof apiTitle === 'string' && apiTitle.trim()) {
        setTitlesById((prev) => ({ ...prev, [id]: apiTitle }));
      }

      const cd = backendChartToChartJs(chart);
      setChartData(cd);
      setContent(chart);
      return;
    }

    // File mode: fetch JSON file
    if (!fileMode || !(props as any).graphs || !(props as any).apiBase) return;

    const graphs = (props as any).graphs as GraphItem[];
    const apiBase = (props as any).apiBase as string;

    const item = graphs.find((g) => g.id === id);
    if (!item) return;

    try {
      const url = (item as any).api_full_url || `${apiBase}${(item as any).url}`;
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();
      setContent(json);

      const fetchedTitle = (json as any)?.meta?.title; // safe access [web:61]
      if (typeof fetchedTitle === 'string' && fetchedTitle.trim()) {
        setTitlesById((prev) => ({ ...prev, [id]: fetchedTitle }));
      }

      if (json && (json as any).x && (json as any).series) {
        const cd = backendChartToChartJs(json as BackendChart);
        setChartData(cd);
      } else {
        setChartData(null);
      }
    } catch {
      setContent('Error loading file');
      setChartData(null);
    }
  };

  const listItems = fileMode
    ? ((props as any).graphs as GraphItem[]) ?? []
    : ((props as any).chartsFromApi as BackendChart[]) ?? [];

  // ✅ Prefetch titles so the list shows titles WITHOUT clicking
  useEffect(() => {
    if (!fileMode) return;

    const graphs = ((props as any).graphs as GraphItem[]) ?? [];
    const apiBase = (props as any).apiBase as string;

    let cancelled = false;

    (async () => {
      for (const g of graphs) {
        if (cancelled) return;

        const id = g.id;
        if (titlesById[id]) continue;

        try {
          const url = (g as any).api_full_url || `${apiBase}${(g as any).url}`;
          const res = await fetch(url, { cache: 'no-store' });
          const json = await res.json();
          const t = (json as any)?.meta?.title; // safe access [web:61]

          if (!cancelled && typeof t === 'string' && t.trim()) {
            setTitlesById((prev) => ({ ...prev, [id]: t }));
          }
        } catch {
          // ignore individual failures
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileMode, (props as any).apiBase, (props as any).graphs, titlesById]);

  const selectedItem =
    fileMode && (props as any).graphs
      ? ((props as any).graphs as GraphItem[]).find((g) => g.id === selectedId)
      : jsonMode && (props as any).chartsFromApi
        ? ((props as any).chartsFromApi as BackendChart[]).find((c) => c.id === selectedId)
        : null;

  // Decide chart type using meta.type
  let chartType: 'bar' | 'line' = 'bar';

  if (jsonMode && (props as any).chartsFromApi && selectedId) {
    const chartsFromApi = (props as any).chartsFromApi as BackendChart[];
    const apiChart = chartsFromApi.find((c) => c.id === selectedId);
    if (apiChart?.meta?.type === 'line') chartType = 'line';
    else if (apiChart?.meta?.type === 'bar') chartType = 'bar';
  } else if (fileMode && selectedItem) {
    const metaType = (selectedItem as any).meta?.type;
    if ((selectedItem as any).format === 'json') {
      const json = content as any;
      const t = json?.meta?.type ?? metaType;
      if (t === 'line') chartType = 'line';
      else if (t === 'bar') chartType = 'bar';
    }
  }

  // meta: prefer JSON content, fallback to item.meta [web:61]
  const contentObj = typeof content === 'object' && content !== null ? (content as any) : null;
  const metaFromContent = contentObj?.meta || {};
  const metaFromItem = (selectedItem as any)?.meta || {};
  const meta = { ...metaFromItem, ...metaFromContent };

  const type = meta.type as string | undefined;
  const kindLabel =
    type === 'bar'
      ? 'Gráfica de barras'
      : type === 'line'
        ? 'Gráfica de líneas'
        : type
          ? `Gráfica (${type})`
          : 'Gráfica';

  const titleLabel = (meta.title as string | undefined) ?? '';
  const xLabel = meta.xLabel || 'X';
  const yLabel = meta.yLabel || 'Y';
  const chartTitle = titleLabel;
  const isHistogram = meta.freq === true;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <ChartSpline className="h-5 w-5 text-xl" />
        <h2 className="text-xl font-semibold right-1">Analytics Graph Creator</h2>
      </div>

      {listItems.length === 0 && (
        <p className="text-sm text-muted-foreground">No graphs found for this run.</p>
      )}

      {listItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-4">
          {/* Left: list of graphs */}
          <div className="border rounded p-2 max-h-72 overflow-y-auto">
            <ul className="space-y-1 text-sm">
              {listItems.map((item: any) => {
                // show title if known, else fall back to cleaned filename
                const listTitle = titlesById[item.id] ?? item.meta?.title ?? prettyGraphLabel(item);

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`w-full flex items-center gap-2 text-left px-2 py-1 rounded hover:bg-accent ${
                        selectedId === item.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleSelect(item.id)}
                      title={listTitle}
                    >
                      <span className="min-w-0 flex-1 truncate">{listTitle}</span>
                      <span className="shrink-0 text-[10px] uppercase text-muted-foreground">
                        ({'format' in item ? item.format : 'json'})
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right: chart + raw preview */}
          <div className="space-y-3">
            <div className="border rounded p-3 bg-card text-sm max-h-[26rem] overflow-auto">
              {!selectedItem && (
                <p className="text-muted-foreground">
                  Select a graph on the left to preview its contents.
                </p>
              )}

              {selectedItem && (
                <div>
                  {(() => {
                    const yValuesRaw =
                      chartData?.datasets?.flatMap((ds) => ds.data).map((v) => Number(v)) ?? [];
                    const yValues = yValuesRaw.filter((v) => !Number.isNaN(v)) as number[];

                    const yScale = isHistogram
                      ? makeHistogramYScale(yValues)
                      : makeTimeSeriesYScale(yValues);

                    return (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-medium">{kindLabel}</h3>
                            <p className="text-[11px] text-muted-foreground">
                              {titleLabel || 'Sin título'}
                            </p>
                          </div>

                          {fileMode &&
                            selectedItem &&
                            'api_full_url' in (selectedItem as any) &&
                            (props as any).apiBase && (
                              <a
                                href={
                                  (selectedItem as any).api_full_url ||
                                  `${(props as any).apiBase}${(selectedItem as any).url}`
                                }
                                download
                                className="text-xs underline text-primary"
                              >
                                Download
                              </a>
                            )}
                        </div>

                        {chartData && (
                          <div className="mb-3">
                            {chartType === 'bar' ? (
                              <Bar
                                data={chartData}
                                options={{
                                  responsive: true,
                                  plugins: {
                                    legend: { display: chartData.datasets.length > 1 },
                                    title: { display: !!chartTitle, text: chartTitle },
                                  },
                                  scales: {
                                    x: {
                                      title: { display: !!xLabel, text: xLabel },
                                      ticks: { autoSkip: true, maxTicksLimit: 12 },
                                    },
                                    y: {
                                      ...yScale,
                                      title: { display: !!yLabel, text: yLabel },
                                    },
                                  },
                                }}
                              />
                            ) : (
                              <Line
                                data={chartData}
                                options={{
                                  responsive: true,
                                  plugins: {
                                    legend: { display: chartData.datasets.length > 1 },
                                    title: { display: !!chartTitle, text: chartTitle },
                                  },
                                  scales: {
                                    x: {
                                      title: { display: !!xLabel, text: xLabel },
                                      ticks: { autoSkip: true, maxTicksLimit: 12 },
                                    },
                                    y: {
                                      ...yScale,
                                      title: { display: !!yLabel, text: yLabel },
                                    },
                                  },
                                }}
                              />
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
