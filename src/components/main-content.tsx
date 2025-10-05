'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import ZoneSummary from '@/components/zone-summary';
import Visualizations from '@/components/visualizations';
import type { SimulationData, ZoneSummaryData } from '@/components/app-layout';

type MainContentProps = {
  simulationData: SimulationData | null;
  zoneSummary: ZoneSummaryData;
};

export default function MainContent({ simulationData, zoneSummary }: MainContentProps) {
  const handleExport = () => {
    if (!simulationData?.csvData) return;
    const blob = new Blob([simulationData.csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'simulation_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <h1 className="text-2xl font-bold font-headline">Dashboard</h1>
        <Button variant="secondary" onClick={handleExport} disabled={!simulationData}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </header>
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <ZoneSummary data={zoneSummary} />
        <Visualizations simulationData={simulationData} />
      </main>
    </div>
  );
}
