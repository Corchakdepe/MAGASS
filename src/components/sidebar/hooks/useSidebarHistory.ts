import {useEffect} from 'react';
import {useSimulationRuns} from '@/hooks/useSimulationHooks';
import {API_BASE} from "@/lib/analysis/constants";
import type {SimulationData} from '@/types/simulation';
import type {HistoryItem} from '../types/sidebar';
import {parseSummary} from '../utils/summaryParser';

export function useSidebarHistory(
  onSimulationComplete?: (data: SimulationData) => void,
  onRunIdChange?: (runId: string) => void
) {
  const {runs: history, loading: loadingHistory, reload: loadHistory} = useSimulationRuns();

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectRun = async (item: HistoryItem) => {
    onRunIdChange?.(item.simfolder);

    if (!onSimulationComplete) return;

    try {
      const summaryRes = await fetch(
        `${API_BASE}/simulation-summary?folder=${encodeURIComponent(item.simfolder)}`,
        {cache: 'no-store'}
      );

      let summaryString = '';
      if (summaryRes.ok) {
        summaryString = await summaryRes.text();
      }

      const summary = parseSummary(summaryString);

      const simData: SimulationData = {
        simName: item.name ?? item.cityname ?? item.simfolder,
        folder: item.simfolder,
        created: item.created,
        fileCount: item.file_count,
        simulationSummary: summary,
        chartData: [],
        mapUrl: '',
        heatmapUrl: '',
        csvData: '',
      };

      onSimulationComplete(simData);
    } catch (e) {
      console.error(e);
    }
  };

  return {
    history,
    loadingHistory,
    loadHistory,
    handleSelectRun,
  };
}
