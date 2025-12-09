// components/dashboard-panel.tsx
'use client';

import {useEffect, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Bike, MapPin, Navigation, Locate} from 'lucide-react'; // Import icons

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
    city: 'N/A',
    numBikes: 0,
    numStations: 0,
    simname: '',
};

/**
 * Dashboard panel displaying key simulation metrics and stations map
 * Shows: City, number of bikes, number of stations, and circle map visualization
 */
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
                    {cache: 'no-store'}
                );

                if (initialResponse.ok) {
                    const data = await initialResponse.json();
                    setInitialData(data);
                } else {
                    throw new Error('Failed to fetch simulation data');
                }

                const mapUrl = `${apiBase}/dashboard/stations-map?run=${encodeURIComponent(runId)}`;
                setStationsMapUrl(mapUrl);

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(errorMessage);
                console.error('Error fetching dashboard data:', err);
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
            <div className="space-y-6">
                <div className="text-center text-muted-foreground py-12">
                    Cargando dashboard...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="text-center text-red-600 py-12">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold font-headline">Dashboard Overview</h2>
                {initialData.simname && (
                    <p className="tex-xl font-medium font-headline">
                        {initialData.simname}
                    </p>
                )}
            </div>

            {/* Summary Cards Grid with Icons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* City Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ciudad</CardTitle>
                        <Navigation className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{initialData.city}</div>
                    </CardContent>
                </Card>

                {/* Bikes Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Número de Bicicletas</CardTitle>
                        <Bike className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {initialData.numBikes.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>

                {/* Stations Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estaciones Disponibles</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {initialData.numStations.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stations Circle Map */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Mapa de Estaciones</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {stationsMapUrl ? (
                        <div className="w-full h-[600px] relative">
                            <iframe
                                src={stationsMapUrl}
                                className="w-full h-full border-0 rounded-b-lg"
                                title="Mapa de Estaciones"
                                loading="lazy"
                                sandbox="allow-scripts allow-same-origin"
                            />
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-12">
                            No hay mapa de estaciones disponible
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
