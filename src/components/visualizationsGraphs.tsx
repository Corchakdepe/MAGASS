// components/visualization-graphs.tsx
'use client';

import {useState} from 'react';
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
import {Bar, Line} from 'react-chartjs-2';
import type {GraphItem} from '@/components/visualizations-panel';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    Title,
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

type ChartDataState = {
    labels: (string | number)[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
    }[];
} | null;

type VisualizationGraphsProps = {
    runId: string;
    apiBase: string;
    graphs?: GraphItem[];          // file mode (JSON files)
    chartsFromApi?: BackendChart[]; // direct API JSON mode
};

// ---------- helpers ----------

// round helper for nicer x labels (old behavior)
const roundNumber = (v: number, decimals = 2) => {
    const factor = 10 ** decimals;
    return Math.round(v * factor) / factor;
};

const backendChartToChartJs = (chart: BackendChart): ChartDataState => {
    const labels = chart.x.map(x =>
        typeof x === 'number' ? roundNumber(x) : x,
    );

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

    return {labels, datasets};
};

// Y-scale for histogram of counts
const makeHistogramYScale = (values: number[]) => {
    if (!values.length) return {beginAtZero: true as const};

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

// Y-scale for time‑series / medias / acumulados
const makeTimeSeriesYScale = (values: number[]) => {
    if (!values.length) return {beginAtZero: true as const};

    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
        beginAtZero: min >= 0,
        min: min >= 0 ? 0 : min,
        max: max * 1.1,
    };
};

export default function VisualizationGraphs(props: VisualizationGraphsProps) {
    const {runId} = props;

    const fileMode = !!(props as any).graphs;
    const jsonMode = !!(props as any).chartsFromApi;

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [content, setContent] = useState<string | object>('');
    const [chartData, setChartData] = useState<ChartDataState>(null);

    const handleSelect = async (id: string) => {
        setSelectedId(id);
        setChartData(null);
        setContent('');

        // API JSON mode: already BackendChart[]
        if (jsonMode && (props as any).chartsFromApi) {
            const chartsFromApi = (props as any).chartsFromApi as BackendChart[];
            const chart = chartsFromApi.find(c => c.id === id);
            if (!chart) return;

            const cd = backendChartToChartJs(chart);
            setChartData(cd);
            setContent(chart);
            return;
        }

        // File mode: fetch JSON file
        if (!fileMode || !(props as any).graphs || !(props as any).apiBase) return;

        const graphs = (props as any).graphs as GraphItem[];
        const apiBase = (props as any).apiBase as string;

        const item = graphs.find(g => g.id === id);
        if (!item) return;

        try {
            const url = item.api_full_url || `${apiBase}${item.url}`;
            const res = await fetch(url, {cache: 'no-store'});
            const json = await res.json();
            setContent(json);

            if (json && json.x && json.series) {
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

    const selectedItem =
        fileMode && (props as any).graphs
            ? ((props as any).graphs as GraphItem[]).find(
                g => g.id === selectedId,
            )
            : jsonMode && (props as any).chartsFromApi
                ? ((props as any).chartsFromApi as BackendChart[]).find(
                    c => c.id === selectedId,
                )
                : null;

    // Decide chart type using meta.type
    let chartType: 'bar' | 'line' = 'bar';

    if (jsonMode && (props as any).chartsFromApi && selectedId) {
        const chartsFromApi = (props as any).chartsFromApi as BackendChart[];
        const apiChart = chartsFromApi.find(c => c.id === selectedId);
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

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                    Graphs {jsonMode ? '(from API JSON)' : '(JSON files)'}
                </h2>
                <span className="text-xs text-muted-foreground">Run: {runId}</span>
            </div>

            {listItems.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    No graphs found for this run.
                </p>
            )}

            {listItems.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-4">
                    {/* Left: list of graphs */}
                    <div className="border rounded p-2 max-h-72 overflow-y-auto">
                        <ul className="space-y-1 text-sm">
                            {listItems.map((item: any) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        className={`w-full text-left px-2 py-1 rounded hover:bg-accent ${
                                            selectedId === item.id ? 'bg-accent' : ''
                                        }`}
                                        onClick={() => handleSelect(item.id)}
                                    >
                                        {'name' in item ? item.name : item.meta?.title || item.id}{' '}
                                        <span className="text-[10px] uppercase text-muted-foreground">
                      ({'format' in item ? item.format : 'json'})
                    </span>
                                    </button>
                                </li>
                            ))}
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
                                        // meta: prefer JSON content, fallback to item.meta
                                        const contentObj =
                                            typeof content === 'object' && content !== null
                                                ? (content as any)
                                                : null;
                                        const metaFromContent = contentObj?.meta || {};
                                        const metaFromItem = (selectedItem as any)?.meta || {};
                                        const meta = {...metaFromItem, ...metaFromContent};

                                        const xLabel = meta.xLabel || 'X';
                                        const yLabel = meta.yLabel || 'Y';
                                        const chartTitle = meta.title || '';
                                        const isHistogram = meta.freq === true;

                                        const yValuesRaw =
                                            chartData?.datasets
                                                ?.flatMap(ds => ds.data)
                                                .map(v => Number(v)) ?? [];
                                        const yValues = yValuesRaw.filter(
                                            v => !Number.isNaN(v),
                                        ) as number[];

                                        const yScale = isHistogram
                                            ? makeHistogramYScale(yValues)
                                            : makeTimeSeriesYScale(yValues);

                                        return (
                                            <>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-medium">
                                                            {'name' in selectedItem
                                                                ? (selectedItem as any).name
                                                                : chartTitle || (selectedItem as any).id}
                                                        </h3>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            Format:{' '}
                                                            {'format' in selectedItem
                                                                ? (selectedItem as any).format.toUpperCase()
                                                                : 'JSON'}
                                                        </p>
                                                    </div>

                                                    {fileMode &&
                                                        'api_full_url' in selectedItem &&
                                                        (props as any).apiBase && (
                                                            <a
                                                                href={
                                                                    (selectedItem as any).api_full_url ||
                                                                    `${(props as any).apiBase}${
                                                                        (selectedItem as any).url
                                                                    }`
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
                                                                        legend: {
                                                                            display:
                                                                                chartData.datasets.length > 1,
                                                                        },
                                                                        title: {
                                                                            display: !!chartTitle,
                                                                            text: chartTitle,
                                                                        },
                                                                    },
                                                                    scales: {
                                                                        x: {
                                                                            title: {
                                                                                display: !!xLabel,
                                                                                text: xLabel,
                                                                            },
                                                                            ticks: {
                                                                                autoSkip: true,
                                                                                maxTicksLimit: 12,
                                                                            },
                                                                        },
                                                                        y: {
                                                                            ...yScale,
                                                                            title: {
                                                                                display: !!yLabel,
                                                                                text: yLabel,
                                                                            },
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
                                                                        legend: {
                                                                            display:
                                                                                chartData.datasets.length > 1,
                                                                        },
                                                                        title: {
                                                                            display: !!chartTitle,
                                                                            text: chartTitle,
                                                                        },
                                                                    },
                                                                    scales: {
                                                                        x: {
                                                                            title: {
                                                                                display: !!xLabel,
                                                                                text: xLabel,
                                                                            },
                                                                            ticks: {
                                                                                autoSkip: true,
                                                                                maxTicksLimit: 12,
                                                                            },
                                                                        },
                                                                        y: {
                                                                            ...yScale,
                                                                            title: {
                                                                                display: !!yLabel,
                                                                                text: yLabel,
                                                                            },
                                                                        },
                                                                    },
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                )}

                                                <pre className="text-xs whitespace-pre-wrap">
                          {typeof content === 'string'
                              ? content
                              : JSON.stringify(content, null, 2)}
                        </pre>
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
