// app/MainContent.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import MainContent from '@/components/main-content';
import type { MainContentMode } from '@/types/view-mode';
import { useSimulationRuns } from '@/hooks/useSimulationHooks';
import { simulationAPI } from '@/lib/api/simulation-client';
import type { SimulationData, SimulationSummaryData } from '@/types/simulation';

type AppMainContentProps = {
  mode?: MainContentMode;
  triggerRefresh?: number;
};

export default function AppMainContent({
  mode = 'analyticsGraphs',
  triggerRefresh,
}: AppMainContentProps) {
  // Use centralized hook for simulation runs
  const {
    runs,
    loading: isLoading,
    error: errorMsg,
    reload
  } = useSimulationRuns();

  // Refresh on triggerRefresh change
  useEffect(() => {
    if (triggerRefresh) {
      reload();
    }
  }, [triggerRefresh, reload]);

  // Get latest simulation
  const latestSimulation = runs[0];
  const latestFolder = latestSimulation?.name;

  // Build SimulationData from the run (note: summary would need separate fetch or context)
  // For now, matching your original structure
  const simulationData: SimulationData | null = latestFolder
    ? {
        folder: latestSimulation.name,
        created: latestSimulation.created,
        fileCount: latestSimulation.file_count,
        simName: latestSimulation.name, // Added missing simName property
        simulationSummary: {} as SimulationSummaryData, // Would need separate fetch
        chartData: [],
        mapUrl: '',
        heatmapUrl: '',
        csvData: '',
      }
    : null;

  const error = errorMsg ? errorMsg.message : null;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-4 border-b bg-card">
          <h1 className="text-2xl font-bold font-headline">Gonzalo Bike Dashboard</h1>
        </header>
        <main className="flex-1 grid place-items-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading…</p>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-4 border-b bg-card">
          <h1 className="text-2xl font-bold font-headline">Gonzalo Bike Dashboard</h1>
          <Button variant="secondary" onClick={reload}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </header>
        <main className="flex-1 grid place-items-center">
          <div className="text-center text-red-600">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  // Empty state
  if (!simulationData || !latestFolder) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-4 border-b bg-card">
          <h1 className="text-2xl font-bold font-headline">Gonzalo Bike Dashboard</h1>
        </header>
        <main className="flex-1 grid place-items-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">No simulation results yet</p>
            <p className="text-sm">Run a simulation to see results here</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <MainContent
      simulationData={simulationData}
      triggerRefresh={triggerRefresh}
      mode={mode}
    />
  );
}
