// Hook to fetch simulation info from the new API endpoint
import {API_BASE} from "@/lib/analysis/constants";
import React from "react";

export function useSimulationInfo(runId: string | undefined) {
  const [data, setData] = React.useState<{
    city: string;
    stations: number;
    total_capacity: number;
    active_bikes: number;
    average_capacity: number;
    min_capacity: number;
    max_capacity: number;
    capacity_range: string;
    simulation_id: string;
    country?: string;
    full_location?: string;
    coordinates?: {
      average_latitude: number;
      average_longitude: number;
    };
  } | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!runId) {
      setData(null);
      return;
    }

    const fetchSimulationInfo = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE}/dashboard/simulation-info/${encodeURIComponent(runId)}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Simulation "${runId}" not found`);
          }
          throw new Error(`Failed to fetch simulation info: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching simulation info:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSimulationInfo();
  }, [runId]);

  return { data, loading, error };
}
