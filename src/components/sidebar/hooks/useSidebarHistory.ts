// hooks/useSidebarHistory.ts

import { useState, useEffect, useCallback } from 'react';
import { useSimulationRuns } from '@/hooks/useSimulationHooks';
import { API_BASE } from "@/lib/analysis/constants";
import type { SimulationData } from '@/types/simulation';
import type { HistoryItem, SimulationParameters } from '../types/sidebar';
import { parseSummary } from '../utils/summaryParser';

export function useSidebarHistory(
  onSimulationComplete?: (data: SimulationData) => void,
  onRunIdChange?: (runId: string) => void
) {
  const { runs: history, loading: loadingHistory, reload: loadHistory } = useSimulationRuns();
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [parameters, setParameters] = useState<SimulationParameters | null>(null);
  const [parametersLoading, setParametersLoading] = useState(false);
  const [parametersError, setParametersError] = useState<string | null>(null);

  // Cargar historial al montar
  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar parámetros cuando cambia el currentRunId
  useEffect(() => {
    if (!selectedItem?.simfolder) return;

    const fetchParameters = async () => {
      setParametersLoading(true);
      setParametersError(null);

      try {
        //  1. Intentar con simulation_info.json
        const infoUrl = `${API_BASE}/results/file/${selectedItem.simfolder}/simulation_info.json`;
        console.log(' Fetching simulation info from:', infoUrl);

        let response = await fetch(infoUrl);

        if (response.ok) {
          const data = await response.json();
          console.log(' Simulation info found:', data);
          setParameters(data.simdata || null);
          setParametersLoading(false);
          return;
        }

        //  2. Fallback a simulations_history.json
        console.log(' Simulation info not found, trying history...');
        const historyUrl = `${API_BASE}/results/file/simulations_history.json`;
        response = await fetch(historyUrl);

        if (response.ok) {
          const historyData = await response.json();
          const simulation = historyData.simulations?.find(
            (sim: any) => sim.simfolder === selectedItem.simfolder
          );

          console.log(' Found simulation in history:', simulation?.simfolder);
          console.log('Simdata from history:', simulation?.simdata);
          setParameters(simulation?.simdata || null);
        } else {
          throw new Error('Could not load simulation parameters');
        }

      } catch (err) {
        console.error(' Error fetching parameters:', err);
        setParametersError(err instanceof Error ? err.message : 'Unknown error');
        setParameters(null);
      } finally {
        setParametersLoading(false);
      }
    };

    fetchParameters();
  }, [selectedItem?.simfolder]);

  const handleSelectRun = useCallback(async (item: HistoryItem) => {
    console.log(' Selecting simulation:', item.simfolder);

    setSelectedItem(item);
    onRunIdChange?.(item.simfolder);

    if (!onSimulationComplete) return;

    try {
      // Fetch simulation summary
      const summaryRes = await fetch(
        `${API_BASE}/simulation-summary?folder=${encodeURIComponent(item.simfolder)}`,
        { cache: 'no-store' }
      );

      let summaryString = '';
      if (summaryRes.ok) {
        summaryString = await summaryRes.text();
        console.log(' Summary fetched successfully');
      }

      const summary = parseSummary(summaryString);

      const simData: SimulationData = {
        simName: item.name ?? item.simname ?? item.cityname ?? item.simfolder,
        folder: item.simfolder,
        created: item.created,
        fileCount: item.file_count ?? 0,
        simulationSummary: summary,
        chartData: [],
        mapUrl: '',
        heatmapUrl: '',
        csvData: '',
      };

      onSimulationComplete(simData);
    } catch (e) {
      console.error('Error fetching simulation summary:', e);
    }
  }, [onRunIdChange, onSimulationComplete]);

  return {
    history,
    loadingHistory,
    loadHistory,
    handleSelectRun,
    selectedItem,
    parameters,
    parametersLoading,
    parametersError
  };
}