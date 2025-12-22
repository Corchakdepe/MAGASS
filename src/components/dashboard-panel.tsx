"use client";

import {useEffect, useState} from "react";
import {Bike, MapPin, Navigation} from "lucide-react";

type DashboardPanelProps = {
    apiBase: string;
    runId: string;
};

type InitialData = {
    city: string;
    numBikes: number;
    numStations: number;
    simname: string;
};

const defaultInitialData: InitialData = {
    city: "N/A",
    numBikes: 0,
    numStations: 0,
    simname: "",
};

function StatRow({
                     label,
                     value,
                     icon,
                 }: {
    label: string;
    value: React.ReactNode;
    icon: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
                <div className="text-[11px] font-medium text-text-secondary">{label}</div>
                <div className="text-lg font-semibold text-text-primary truncate">
                    {value}
                </div>
            </div>
            <div className="shrink-0 text-text-secondary">{icon}</div>
        </div>
    );
}

export default function DashboardPanel({apiBase, runId}: DashboardPanelProps) {
    const [initialData, setInitialData] = useState<InitialData>(defaultInitialData);
    const [stationsMapUrl, setStationsMapUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const initialResponse = await fetch(
                    `${apiBase}/dashboard/initial-data?run=${encodeURIComponent(runId)}`,
                    {cache: "no-store"},
                );

                if (initialResponse.ok) {
                    const data = await initialResponse.json();
                    setInitialData(data);
                } else {
                    throw new Error("Failed to fetch simulation data");
                }

                const mapUrl = `${apiBase}/dashboard/stations-map?run=${encodeURIComponent(
                    runId,
                )}`;
                setStationsMapUrl(mapUrl);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error";
                setError(errorMessage);
                console.error("Error fetching dashboard data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (runId) {
            fetchDashboardData();
        }
    }, [apiBase, runId]);

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="text-sm text-text-secondary py-12">
                    Cargando dashboard...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md px-4 py-3">
                    <p className="text-sm font-semibold text-danger">Error</p>
                    <p className="text-xs text-text-secondary">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 min-w-0">
            {/* Header (no card) */}
            <div className="min-w-0">
                <h2 className="text-lg font-semibold font-headline text-text-primary">
                    {initialData.simname && initialData.simname}
                </h2>
            </div>

            {/* Summary (single surface, avoid cards-in-cards) */}
            <div
                className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel px-4 py-3 divide-y divide-surface-3/70">
                <StatRow
                    label="Ciudad"
                    value={initialData.city}
                    icon={<Navigation className="h-4 w-4"/>}
                />
                <StatRow
                    label="Número de Bicicletas"
                    value={initialData.numBikes.toLocaleString()}
                    icon={<Bike className="h-4 w-4"/>}
                />
                <StatRow
                    label="Estaciones Disponibles"
                    value={initialData.numStations.toLocaleString()}
                    icon={<MapPin className="h-4 w-4"/>}
                />
            </div>

            {/* Map (single surface) */}
            <div
                className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-3/70">
                    <div className="text-sm font-semibold text-text-primary">
                        Mapa de Estaciones
                    </div>
                    <div className="text-[11px] text-text-secondary">
                        Vista general de estaciones del escenario seleccionado
                    </div>
                </div>

                {stationsMapUrl ? (
                    <div className="w-full h-[600px] bg-surface-0">
                        <iframe
                            src={stationsMapUrl}
                            className="w-full h-full "
                            title="Mapa de Estaciones"
                            loading="lazy"
                            sandbox="allow-scripts allow-same-origin"
                        />
                    </div>
                ) : (
                    <div className="text-center text-text-secondary py-12 bg-surface-0">
                        No hay mapa de estaciones disponible
                    </div>
                )}
            </div>
        </div>
    );
}
