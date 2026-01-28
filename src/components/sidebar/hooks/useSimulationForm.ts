import {useState} from 'react';
import {useToast} from '@/hooks/use-toast';
import {useLanguage} from '@/contexts/LanguageContext';
import {API_BASE} from "@/lib/analysis/constants";
import type {SimulationData} from '@/types/simulation';

export function useSimulationForm(onSimulationComplete: (data: SimulationData) => void) {
  const {t} = useLanguage();
  const {toast} = useToast();

  const [isSimulating, setIsSimulating] = useState(false);
  const [folderPath, setFolderPath] = useState('./Datos/Marzo_Reales');
  const [outputPath, setOutputPath] = useState('');
  const [simName, setSimName] = useState('');
  const [stress, setStress] = useState(0);
  const [walkCost, setWalkCost] = useState(100);
  const [delta, setDelta] = useState(15);
  const [stressType, setStressType] = useState('0');

  const handleRunSimulation = async () => {
    if (!folderPath.trim()) {
      toast({
        variant: 'destructive',
        title: t('folderRequired'),
        description: t('enterValidInputFolder'),
      });
      return;
    }

    setIsSimulating(true);

    try {
      const body = {
        ruta_entrada: folderPath,
        ruta_salida: outputPath.trim() || null,
        stress_type: Number(stressType),
        stress: stress / 100,
        walk_cost: walkCost / 100,
        delta,
        dias: null,
        simname: simName || null,
      };

      const response = await fetch(`${API_BASE}/exe/simular-json`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || t('simulationFailed'));
      }

      const result = await response.json();
      onSimulationComplete(result);

      toast({
        title: t('simulationComplete'),
        description: t('simulationFinishedSuccessfully'),
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error instanceof Error ? error.message : t('simulationFailed'),
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return {
    isSimulating,
    folderPath,
    setFolderPath,
    outputPath,
    setOutputPath,
    simName,
    setSimName,
    stress,
    setStress,
    walkCost,
    setWalkCost,
    delta,
    setDelta,
    stressType,
    setStressType,
    handleRunSimulation,
  };
}
