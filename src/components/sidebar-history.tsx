// components/sidebar-history.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent as SidebarBody,
  SidebarFooter,
} from '@/components/ui/sidebar';
import SidebarContentUploadSim from '@/components/sidebar-content-upload-sim';
import SidebarContentUploadMaps from '@/components/sidebar-content-upload-maps';
import GraphAnalysisSidebar from '@/components/graph-analysis-sidebar';
import { Button } from '@/components/ui/button';
import type { SimulationData } from '@/types/simulation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000';

type SidebarHistoryProps = {
  onSimulationComplete?: (data: SimulationData) => void;
};

type HistoryItem = {
  name: string;
  simfolder: string;
  created: string;
  file_count: number;
  cityname?: string | null;
  numberOfStations?: number | null;
  numberOfBikes?: number | null;
};

const parseSummary = (summaryString: string) => {
  const cleaned = summaryString.trim().replace(/^"|"$/g, '');
  const values = cleaned.split(',').map(v => Number(v.trim()) || 0);
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

export default function SidebarHistory({ onSimulationComplete }: SidebarHistoryProps) {
  const pathname = usePathname();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`${API_BASE}/list-simulations`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load simulations');
      const data = await res.json();
      setHistory(Array.isArray(data.simulations) ? data.simulations : []);
    } catch (e) {
      console.error(e);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSelectRun = async (item: HistoryItem) => {
    if (!onSimulationComplete) return;

    try {
      const summaryRes = await fetch(
        `${API_BASE}/simulation-summary?folder=${encodeURIComponent(item.simfolder)}`,
        { cache: 'no-store' },
      );

      let summaryString = '';
      if (summaryRes.ok) {
        summaryString = await summaryRes.text();
      }
      console.log('SidebarHistory summary status', summaryRes.status, 'body:', summaryString);

      const summary = parseSummary(summaryString);

      const simData: SimulationData = {
        folder: item.simfolder,
        created: item.created,
        fileCount: item.file_count,
        simulationSummary: summary,
        chartData: [],
        mapUrl: '',
        heatmapUrl: '',
        csvData: '',
      };

      console.log('SidebarHistory simData', simData);
      onSimulationComplete(simData);
    } catch (e) {
      console.error(e);
    }
  };

  let content: React.ReactNode = (
    <p className="text-xs text-muted-foreground">
      Select a section on the left to configure simulations or analytics.
    </p>
  );

  if (pathname.startsWith('/history')) {
    content = (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Simulation history</h3>
          <Button variant="outline" size="icon" className="h-6 w-6" onClick={loadHistory}>
            ⟳
          </Button>
        </div>
        {loadingHistory && (
          <p className="text-xs text-muted-foreground">Loading history…</p>
        )}
        {!loadingHistory && history.length === 0 && (
          <p className="text-xs text-muted-foreground">No simulations yet.</p>
        )}
        <ul className="space-y-1 max-h-80 overflow-y-auto">
          {history.map(item => (
            <li key={item.simfolder}>
              <button
                  type="button"
                  onClick={() => handleSelectRun(item)}
                  className="w-full text-left px-2 py-1 rounded hover:bg-muted text-xs"
              >
                <div className="font-medium truncate">
                  {item.cityname ?? 'Unknown city'}
                </div>
                <div className="text-[10px] text-muted-foreground">Date {item.created}</div>
                <div className="text-[10px] text-muted-foreground">Simumation Folder {item.name}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  } else if (pathname.startsWith('/simulador') && onSimulationComplete) {
    content = <SidebarContentUploadSim onSimulationComplete={onSimulationComplete} />;
  } else if (pathname.startsWith('/analyticsMapCreator') && onSimulationComplete) {
    content = <SidebarContentUploadMaps onSimulationComplete={onSimulationComplete} />;
  } else if (pathname.startsWith('/analyticsGraphCreator')) {
    content = <GraphAnalysisSidebar />;
  }

  return (
    <>
      <SidebarHeader className="p-4">
        <h2 className="text-xl font-semibold font-headline">Tools</h2>
      </SidebarHeader>
      <SidebarBody className="p-4 space-y-4 overflow-y-auto">
        {content}
      </SidebarBody>
      <SidebarFooter className="p-4 border-t">
        <p className="text-[10px] text-muted-foreground">Right sidebar</p>
      </SidebarFooter>
    </>
  );
}
