// hooks/useSimulationParameters.ts

import { useState, useEffect } from 'react';
import { API_BASE } from '@/lib/analysis/constants';
import type { SimulationParameters } from '../types/sidebar';

export function useSimulationParameters() {
  const [parameters, setParameters] = useState<SimulationParameters | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParameters = async (simfolder: string) => {
    setLoading(true);
    setError(null);

    try {
      //  Intentar obtener simulation_info.json
      const infoUrl = `${API_BASE}/results/file/${simfolder}/simulation_info.json`;
      console.log(' Fetching simulation info from:', infoUrl);

      const infoResponse = await fetch(infoUrl);

      if (infoResponse.ok) {
        const data = await infoResponse.json();
        console.log(' Simulation info found:', data);

        //  EXTRAER PARÁMETROS DIRECTAMENTE DEL JSON (NO de simdata)
        const params: SimulationParameters = {
          stress_type: 0, // Valor por defecto, extraer del nombre si es posible
          stress: 0.0,   // Valor por defecto
          walk_cost: 0.0, // Valor por defecto
          delta: 0,      // Valor por defecto
          dias: []        // Valor por defecto
        };

        // Intentar extraer del nombre de la carpeta
        const folderMatch = simfolder.match(/sim_ST(\d+)_S(\d+\.?\d*)_WC(\d+\.?\d*)_D(\d+)/);
        if (folderMatch) {
          params.stress_type = parseInt(folderMatch[1]);
          params.stress = parseFloat(folderMatch[2]);
          params.walk_cost = parseFloat(folderMatch[3]);
          params.delta = parseInt(folderMatch[4]);
        }

        console.log(' Extracted parameters:', params);
        setParameters(params);
        setLoading(false);
        return;
      }

      //  Fallback a list-simulations
      console.log(' Simulation info not found, fetching list-simulations...');
      const listUrl = `${API_BASE}/list-simulations`;
      const listResponse = await fetch(listUrl);

      if (!listResponse.ok) {
        throw new Error('Failed to load simulation list');
      }

      const listData = await listResponse.json();

      const simulation = listData.simulations?.find(
        (sim: any) => sim.simfolder === simfolder
      );

      if (simulation) {
        console.log(' Simulation found in list:', simulation.simfolder);
        console.log(' Simdata:', simulation.simdata);
        setParameters(simulation.simdata || null);
      } else {
        setError(`Simulation not found: ${simfolder}`);
        setParameters(null);
      }

    } catch (err) {
      console.error(' Error fetching parameters:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setParameters(null);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setParameters(null);
    setError(null);
  };

  return {
    parameters,
    loading,
    error,
    fetchParameters,
    reset
  };
}

// Hook para usar con currentRunId
export function useSelectedSimulationParameters(currentRunId: string | undefined) {
  const { parameters, loading, error, fetchParameters, reset } = useSimulationParameters();

  useEffect(() => {
    if (currentRunId) {
      console.log(' CurrentRunId changed:', currentRunId);
      fetchParameters(currentRunId);
    } else {
      reset();
    }
  }, [currentRunId]);

  return { parameters, loading, error };
}