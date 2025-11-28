'use client';

import {useState} from 'react';
import type {RawResultItem} from '@/components/oldv/main-content-graphs';
import Papa from 'papaparse';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
} from 'chart.js';
import {Bar, Line} from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend
);

type GraphItem = RawResultItem;

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
        [k: string]: any;
    };
};

type ChartDataState = {
    labels: (string | number)[];
    datasets: { label: string; data: number[]; backgroundColor: string }[];
} | null;

type Props =
    | {
    runId: string;
    graphs: GraphItem[];
    apiBase: string;
    chartsFromApi?: undefined;
}
    | {
    runId: string;
    graphs?: undefined;
    apiBase?: undefined;
    chartsFromApi: BackendChart[];
};

const backendChartToChartJs = (chart: BackendChart): ChartDataState => {
    const labels = chart.x;
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

export default function VisualizationsGraphs(props: Props) {
    const {runId} = props;

    const fileMode = !!(props as any).graphs;
    const jsonMode = !!(props as any).chartsFromApi;

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [content, setContent] = useState<string | object>('');
    const [chartData, setChartData] = useState<ChartDataState>(null);

    const parseXYCsv = (
        csvText: string,
        label: string
    ): {
        datasets: {
            backgroundColor: string;
            borderColor: string;
            data: number[];
            hoverBackgroundColor: string;
            hoverBorderColor: string;
            label: string;
        }[];
        labels: number[];
    } => {
        const parsed = Papa.parse(csvText.trim(), {
            header: true,
            skipEmptyLines: true,
        });

        const rows = parsed.data as Record<string, string>[];

        const xs: number[] = [];
        const ys: number[] = [];

        rows.forEach(r => {
            const x = Number(r.x);
            let yRaw: number | null = null;

            if (r.value !== undefined) {
                yRaw = Number(r.value);
            } else if (r.cum !== undefined) {
                yRaw = Number(r.cum);
            } else {
                for (const [k, v] of Object.entries(r)) {
                    if (k === 'x') continue;
                    const num = Number(v);
                    if (!Number.isNaN(num)) {
                        yRaw = num;
                        break;
                    }
                }
            }

            if (!Number.isNaN(x) && yRaw !== null && !Number.isNaN(yRaw)) {
                xs.push(x);
                ys.push(yRaw);
            }
        });

        return {
            labels: xs,
            datasets: [
                {
                    label,
                    data: ys,
                    backgroundColor: 'rgba(54,162,235,0.7)',
                    borderColor: 'rgba(54,162,235,1)',
                    hoverBackgroundColor: 'rgba(34,197,94,0.8)',
                    hoverBorderColor: 'rgba(22,163,74,1)',
                },
            ],
        };
    };

    const handleSelect = async (id: string) => {
        setSelectedId(id);
        setChartData(null);
        setContent('');

        // JSON mode (charts from /exe/analizar)
        if (jsonMode && (props as any).chartsFromApi) {
            const chartsFromApi = (props as any).chartsFromApi as BackendChart[];
            const chart = chartsFromApi.find(c => c.id === id);
            if (!chart) return;

            const cd = backendChartToChartJs(chart);
            setChartData(cd);
            setContent(chart);
            return;
        }

        // File mode (existing CSV/JSON files)
        if (!fileMode || !(props as any).graphs || !(props as any).apiBase) return;

        const graphs = (props as any).graphs as GraphItem[];
        const apiBase = (props as any).apiBase as string;

        const item = graphs.find(g => g.id === id);
        if (!item) return;

        try {
            const url = item.api_full_url || `${apiBase}${item.url}`;

            if (item.format === 'csv') {
                const res = await fetch(url, {cache: 'no-store'});
                const text = await res.text();
                setContent(text);

                const cd = parseXYCsv(text, item.name);
                setChartData(cd);
            } else {
                const res = await fetch(url, {cache: 'no-store'});
                const json = await res.json();
                setContent(json);
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
            ? ((props as any).graphs as GraphItem[]).find(g => g.id === selectedId)
            : jsonMode && (props as any).chartsFromApi
                ? ((props as any).chartsFromApi as BackendChart[]).find(
                    c => c.id === selectedId
                )
                : null;

    // Decide chart type: JSON → meta.type, CSV → filename heuristics
    let chartType: 'bar' | 'line' = 'bar';

    if (jsonMode && (props as any).chartsFromApi && selectedId) {
        const chartsFromApi = (props as any).chartsFromApi as BackendChart[];
        const apiChart = chartsFromApi.find(c => c.id === selectedId);
        if (apiChart?.meta?.type === 'line') {
            chartType = 'line';
        }
    } else if (fileMode && selectedItem) {
        const name = ((selectedItem as any).name || (selectedItem as any).id || '')
            .toString()
            .toLowerCase();
        if (name.includes('acumulado') || name.includes('acumulad')) {
            chartType = 'line';
        }
    }

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                    Graphs {jsonMode ? '(from API JSON)' : '(CSV / JSON files)'}
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

                    <div className="space-y-3">
                        <div className="border rounded p-3 bg-card text-sm max-h-[26rem] overflow-auto">
                            {!selectedItem && (
                                <p className="text-muted-foreground">
                                    Select a graph on the left to preview its contents.
                                </p>
                            )}

                            {selectedItem && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h3 className="font-medium">
                                                {'name' in selectedItem
                                                    ? (selectedItem as any).name
                                                    : (selectedItem as any).meta?.title ||
                                                    (selectedItem as any).id}
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
                                                                display: chartData.datasets.length > 1,
                                                            },
                                                        },
                                                        scales: {
                                                            x: {
                                                                title: {
                                                                    display: !!(selectedItem as any)?.meta
                                                                        ?.xLabel,
                                                                    text:
                                                                        (selectedItem as any)?.meta?.xLabel || 'X',
                                                                },
                                                            },
                                                            y: {
                                                                title: {
                                                                    display: !!(selectedItem as any)?.meta
                                                                        ?.yLabel,
                                                                    text:
                                                                        (selectedItem as any)?.meta?.yLabel || 'Y',
                                                                },
                                                                beginAtZero: true,
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
                                                                display: chartData.datasets.length > 1,
                                                            },
                                                        },
                                                        scales: {
                                                            x: {
                                                                title: {
                                                                    display: !!(selectedItem as any)?.meta
                                                                        ?.xLabel,
                                                                    text:
                                                                        (selectedItem as any)?.meta?.xLabel || 'X',
                                                                },
                                                            },
                                                            y: {
                                                                title: {
                                                                    display: !!(selectedItem as any)?.meta
                                                                        ?.yLabel,
                                                                    text:
                                                                        (selectedItem as any)?.meta?.yLabel || 'Y',
                                                                },
                                                                beginAtZero: true,
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
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
