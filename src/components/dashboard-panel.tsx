"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike, MapPin, Navigation } from "lucide-react";

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

export default function DashboardPanel({ apiBase, runId }: DashboardPanelProps) {
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
          { cache: "no-store" },
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
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
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
        <div className="text-center text-destructive py-12">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 ">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-headline text-brand-700">
          Dashboard Overview
        </h2>
        {initialData.simname && (
          <p className="text-xl font-medium font-headline text-brand-500">
            {initialData.simname}
          </p>
        )}
      </div>

      {/* Summary Cards Grid with Icons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* City Card */}
        <Card className="bg-brand-50 border border-brand-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-700">
              Ciudad
            </CardTitle>
            <Navigation className="h-4 w-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {initialData.city}
            </div>
          </CardContent>
        </Card>

        {/* Bikes Card */}
        <Card className="bg-brand-50 border border-brand-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-700">
              NÃºmero de Bicicletas
            </CardTitle>
            <Bike className="h-4 w-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {initialData.numBikes.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Stations Card */}
        <Card className="bg-brand-50 border border-brand-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-700">
              Estaciones Disponibles
            </CardTitle>
            <MapPin className="h-4 w-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {initialData.numStations.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stations Circle Map */}
      <Card className="bg-brand-50 border border-brand-100">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-brand-700">
            Mapa de Estaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stationsMapUrl ? (
            <div className="w-full h-[600px] relative rounded-b-xl overflow-hidden bg-brand-50">
              <iframe
                src={stationsMapUrl}
                className="w-full h-full border-0"
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