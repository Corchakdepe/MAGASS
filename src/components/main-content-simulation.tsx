'use client';

import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import ZoneSummarySimulation from '@/components/zone-summary-simulation';
import Visualizations from '@/components/visualizations';
import { useState, useEffect } from 'react';
import type { SimulationData, SimulationSummaryData } from '@/types/simulation';

type MainContentProps = {
  simulationData: SimulationData | null;
  triggerRefresh?: number;
};

const defaultSummary: SimulationSummaryData = {
  deltaMinutes: 0,
  stressPercentage: 0,
  realPickupKms: 0,
  realDropoffKms: 0,
  fictionalPickupKms: 0,
  fictionalDropoffKms: 0,
  resolvedRealPickups: 0,
  resolvedRealDropoffs: 0,
  unresolvedRealPickups: 0,
  unresolvedRealDropoffs: 0,
  resolvedFictionalPickups: 0,
  resolvedFictionalDropoffs: 0,
  unresolvedFictionalPickups: 0,
  unresolvedFictionalDropoffs: 0,
};

// Parse simulation data from text format
const parseSimulationData = (dataString: string): SimulationSummaryData => {
  const cleanedDataString = dataString.trim().replace(/^"|"$/g, '');
  const values = cleanedDataString.split(',').map((value, idx) => {
    const num = parseFloat(value.trim());
    if (isNaN(num)) {
      console.warn(`Warning: Value at index ${idx} is NaN, defaulting to 0 (received "${value}")`);
      return 0;
    }
    return num;
  });

  return {
    deltaMinutes: values[0] || 0,
    stressPercentage: values[1] || 0,
    realPickupKms: values[2] || 0,
    realDropoffKms: values[3] || 0,
    fictionalPickupKms: values[4] || 0,
    fictionalDropoffKms: values[5] || 0,
    resolvedRealPickups: values[6] || 0,
    resolvedRealDropoffs: values[7] || 0,
    unresolvedRealPickups: values[8] || 0,
    unresolvedRealDropoffs: values[9] || 0,
    resolvedFictionalPickups: values[10] || 0,
    resolvedFictionalDropoffs: values[11] || 0,
    unresolvedFictionalPickups: values[12] || 0,
    unresolvedFictionalDropoffs: values[13] || 0,
  };
};

export default function MainContent({ simulationData: externalSimData, triggerRefresh }: MainContentProps) {
  const [simulationData, setSimulationData] = useState<SimulationData | null>(externalSimData);
  const [simulationSummary, setSimulationSummary] = useState<SimulationSummaryData>(defaultSummary);
  const [latestFolder, setLatestFolder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestSimulation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get list of simulations
      const listResponse = await fetch('http://127.0.0.1:8000/list-simulations');
      if (!listResponse.ok) throw new Error('Failed to fetch simulations');

      const listData = await listResponse.json();

      if (listData.simulations && listData.simulations.length > 0) {
        const latest = listData.simulations[0];
        setLatestFolder(latest.name);

        // Initialize with default summary
        let parsedSummary = defaultSummary;

        // Fetch simulation summary from ResumenEjecucion file
        const summaryResponse = await fetch('http://127.0.0.1:8000/simulation-summary');
        if (summaryResponse.ok) {
          const summaryText = await summaryResponse.text();
          console.log('Raw summary data:', summaryText);

          parsedSummary = parseSimulationData(summaryText);
          console.log('Parsed summary:', parsedSummary);
        }

        setSimulationSummary(parsedSummary);

        // Set simulation data
        const fullSimData: SimulationData = {
          folder: latest.name,
          created: latest.created,
          fileCount: latest.file_count,
          simulationSummary: parsedSummary,
          chartData: [],
          mapUrl: '',
          heatmapUrl: '',
          csvData: '',
        };

        setSimulationData(fullSimData);
      } else {
        setSimulationData(null);
        setLatestFolder(null);
        setSimulationSummary(defaultSummary);
      }
    } catch (err) {
      console.error('Error fetching simulation data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load simulation data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and when triggerRefresh changes
  useEffect(() => {
    fetchLatestSimulation();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchLatestSimulation, 1000000000);
    return () => clearInterval(interval);
  }, [triggerRefresh]);

  // Update when external data changes
  useEffect(() => {
    if (externalSimData) {
      setSimulationData(externalSimData);
      if (externalSimData.simulationSummary) {
        setSimulationSummary(externalSimData.simulationSummary);
      }
    }
  }, [externalSimData]);

  const handleExport = async () => {
    if (!latestFolder) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/download-results?folder_name=${encodeURIComponent(latestFolder)}`
      );

      if (!response.ok) throw new Error('Failed to download results');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${latestFolder}_results.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-4 border-b bg-card">
          <h1 className="text-2xl font-bold font-headline">Gonzalo Bike Dashboard</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading simulation data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-4 border-b bg-card">
          <h1 className="text-2xl font-bold font-headline">Gonzalo Bike Dashboard</h1>
          <Button variant="secondary" onClick={fetchLatestSimulation}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-600">
            <p className="font-semibold">Error loading data</p>
            <p className="text-sm">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!simulationData || !latestFolder) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-4 border-b bg-card">
          <h1 className="text-2xl font-bold font-headline">Gonzalo Bike Dashboard</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">No simulation results yet</p>
            <p className="text-sm">Run a simulation to see results here</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div>
          <h1 className="text-2xl font-bold font-headline">Gonzalo Bike Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Latest: {latestFolder}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLatestSimulation}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </header>
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <ZoneSummarySimulation data={simulationSummary} />
        <Visualizations simulationData={simulationData} />
      </main>
    </div>
  );
}
