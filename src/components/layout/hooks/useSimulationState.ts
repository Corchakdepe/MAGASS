import {useState} from "react";
import type {SimulationData} from "@/types/simulation";

export function useSimulationState() {
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [simulationName, setSimulationName] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSimulationComplete = (data: SimulationData) => {
    setSimulationData(data);
    setSimulationName(data.simName);
    setCurrentRunId(data.folder);
    setRefreshTrigger((prev) => prev + 1);
  };

  return {
    simulationData,
    currentRunId,
    simulationName,
    refreshTrigger,
    setCurrentRunId,
    handleSimulationComplete,
  };
}