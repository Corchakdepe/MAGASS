'use client';

import { useEffect, useState } from 'react';
import SidebarContent from '@/components/sidebar-content';
import MainContent from '@/components/main-content';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';

export type ZoneSummaryData = {
  totalZones: number;
  activeBikes: number;
  avgTripDuration: number;
  issuesDetected: number;
};

export type ChartData = {
  name: string;
  bikes: number;
}[];

export type SimulationData = {
  zoneSummary: ZoneSummaryData;
  chartData: ChartData;
  mapUrl: string;
  heatmapUrl: string;
  csvData: string;

  heatmapHtmlPath: "./Resultados_Analisis/Marzo_Reales/20251002_120308_MapaDensidad_instante0D15.0S0.0C0.0.html",
  // heatmapUrl opcional (fallback estático), chartData, etc.

};

export default function AppLayout() {
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [zoneSummary, setZoneSummary] = useState<ZoneSummaryData>({
    totalZones: 0,
    activeBikes: 0,
    avgTripDuration: 0,
    issuesDetected: 0,
  });

  // Auto-update every 5 seconds
  useEffect(() => {
    const fetchZoneSummary = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/zones');
        if (!res.ok) throw new Error(`Failed with ${res.status}`);
        const json = await res.json();
        setZoneSummary(json);
      } catch (err) {
        console.error('Fetch zone summary failed:', err);
      }
    };

    fetchZoneSummary(); // initial fetch
    const interval = setInterval(fetchZoneSummary, 10000); // repeat every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent
          setSimulationData={setSimulationData}
          isSimulating={isSimulating}
          setIsSimulating={setIsSimulating}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
        />
      </Sidebar>
      <SidebarInset>
        <MainContent
          simulationData={simulationData}
          zoneSummary={simulationData?.zoneSummary ?? zoneSummary}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
