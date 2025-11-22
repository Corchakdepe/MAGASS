// components/visualizationsGraphs.tsx
'use client';

import {useState} from 'react';
import type {RawResultItem} from '@/components/main-content-graphs';
import Papa from 'papaparse';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from 'chart.js';
import {Bar} from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type GraphItem = RawResultItem;

type Props = {
    runId: string;
    graphs: GraphItem[];
    apiBase: string;
};

type ChartDataState = {
    labels: (string | number)[];
    datasets: { label: string; data: number[]; backgroundColor: string }[];
} | null;

export default function VisualizationsGraphs({runId, graphs, apiBase}: Props) {
    const [selectedGraph, setSelectedGraph] = useState<GraphItem | null>(null);
    const [content, setContent] = useState<string | object>('');
    const [chartData, setChartData] = useState<ChartDataState>(null);

    const parseXYCsv = (csvText: string, label: string): {
        datasets: {
            backgroundColor: string;
            borderColor: string;
            data: number[];
            hoverBackgroundColor: string;
            hoverBorderColor: string;
            label: string
        }[];
        labels: number[]
    } => {
        const parsed = Papa.parse(csvText.trim(), {
            header: true,          // expects "x,value"
            skipEmptyLines: true,
        });

        const rows = parsed.data as { x?: string; value?: string }[];

        const xs: number[] = [];
        const ys: number[] = [];

        rows.forEach(r => {
            const x = Number(r.x);
            const rawY = Number(r.value);
            if (!Number.isNaN(x) && !Number.isNaN(rawY)) {
                xs.push(x);
                ys.push(Math.round(rawY));   // rounded frequency
            }
        });

        return {
            labels: xs,
            datasets: [
                {
                    label,
                    data: ys,
                    backgroundColor: 'rgba(54,162,235,0.7)',      // normal blue
                    borderColor: 'rgba(54,162,235,1)',
                    hoverBackgroundColor: 'rgba(34,197,94,0.8)',  // green on hover
                    hoverBorderColor: 'rgba(22,163,74,1)',        // darker green border
                },
            ],
        };
    };

    const handleSelect = async (item: GraphItem) => {
        setSelectedGraph(item);
        setChartData(null);
        setContent('');

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

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Graphs (CSV / JSON)</h2>
                <span className="text-xs text-muted-foreground">Run: {runId}</span>
            </div>

            {graphs.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    No graph files found for this run.
                </p>
            )}

            {graphs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-4">
                    <div className="border rounded p-2 max-h-72 overflow-y-auto">
                        <ul className="space-y-1 text-sm">
                            {graphs.map(item => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        className={`w-full text-left px-2 py-1 rounded hover:bg-accent ${
                                            selectedGraph?.id === item.id ? 'bg-accent' : ''
                                        }`}
                                        onClick={() => handleSelect(item)}
                                    >
                                        {item.name}{' '}
                                        <span className="text-[10px] uppercase text-muted-foreground">
                      ({item.format})
                    </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <div className="border rounded p-3 bg-card text-sm max-h-[26rem] overflow-auto">
                            {!selectedGraph && (
                                <p className="text-muted-foreground">
                                    Select a graph file on the left to preview its contents.
                                </p>
                            )}

                            {selectedGraph && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h3 className="font-medium">{selectedGraph.name}</h3>
                                            <p className="text-[11px] text-muted-foreground">
                                                Format: {selectedGraph.format.toUpperCase()}
                                            </p>
                                        </div>
                                        <a
                                            href={selectedGraph.api_full_url || `${apiBase}${selectedGraph.url}`}
                                            download
                                            className="text-xs underline text-primary"
                                        >
                                            Download
                                        </a>
                                    </div>

                                    {chartData && selectedGraph.format === 'csv' && (
                                        <div className="mb-3">
                                            <Bar
                                                data={chartData}
                                                options={{
                                                    responsive: true,
                                                    plugins: {legend: {display: false}},
                                                    scales: {
                                                        x: {
                                                            title: {display: true, text: 'Valores'},
                                                            ticks: {
                                                                callback: (value, index) => {
                                                                    const v = (chartData.labels[index] ?? value) as number;
                                                                    return Math.round(v).toString();
                                                                },
                                                            },
                                                        },
                                                        y: {
                                                            title: {display: true, text: 'Frecuencia'},
                                                            beginAtZero: true,
                                                            ticks: {
                                                                callback: v => Math.round(Number(v)).toString(),
                                                            },
                                                        },
                                                    },
                                                }}
                                            />
                                        </div>
                                    )}

                                    {selectedGraph.format === 'csv' ? (
                                        <pre className="whitespace-pre-wrap text-xs">
                      {typeof content === 'string' ? content : ''}
                    </pre>
                                    ) : (
                                        <pre className="text-xs">
                      {typeof content === 'string'
                          ? content
                          : JSON.stringify(content, null, 2)}
                    </pre>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
