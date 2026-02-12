// Hook to fetch simulation info from the persistent JSON file
import React from "react";
import {API_BASE} from "@/lib/analysis/constants";

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
        total_bikes?: number;  // Add this field
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
                // Construct the correct path to the JSON file
                // The JSON is located at: /results/{runId}/simulation_info.json
                const jsonUrl = `${API_BASE}/results/file/${runId}/simulation_info.json`;

                console.log(`Fetching simulation info from: ${jsonUrl}`);

                const response = await fetch(jsonUrl);

                if (!response.ok) {
                    if (response.status === 404) {
                        // Try with sim_ prefix if not present
                        if (!runId.startsWith('sim_')) {
                            const altJsonUrl = `/results/sim_${encodeURIComponent(runId)}/simulation_info.json`;
                            console.log(`Trying alternative URL: ${altJsonUrl}`);
                            const altResponse = await fetch(altJsonUrl);

                            if (altResponse.ok) {
                                const result = await altResponse.json();
                                setData(transformJsonToApiFormat(result, runId));
                                return;
                            }
                        }
                        throw new Error(`Simulation info not found for "${runId}"`);
                    }
                    throw new Error(`Failed to fetch simulation info: ${response.statusText}`);
                }

                const jsonData = await response.json();
                console.log('Received JSON data:', jsonData);
                setData(transformJsonToApiFormat(jsonData, runId));
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

    return {data, loading, error};
}

// Helper function to transform JSON format to API response format
function transformJsonToApiFormat(jsonData: any, runId: string) {
    // Log for debugging
    console.log('Transforming JSON data:', jsonData);

    // Extract total bikes from TOTAL_BIKES field
    const totalBikes = jsonData.TOTAL_BIKES || 0;

    return {
        city: jsonData.CITY || "Unknown City",
        stations: jsonData.STATIONS?.count || 0,
        total_capacity: jsonData.TOTAL_CAPACITY || 0,
        // Map TOTAL_BIKES to active_bikes (this is the initial state)
        active_bikes: totalBikes,
        // Also expose total_bikes separately if needed
        total_bikes: totalBikes,
        average_capacity: jsonData.STATIONS?.avg_capacity || 0,
        min_capacity: jsonData.MIN_CAPACITY || 0,
        max_capacity: jsonData.MAX_CAPACITY || 0,
        capacity_range: jsonData.CAPACITY_RANGE || `${jsonData.MIN_CAPACITY || 0}-${jsonData.MAX_CAPACITY || 0}`,
        simulation_id: runId,
        country: jsonData.COUNTRY || "",
        full_location: jsonData.FULL_LOCATION || jsonData.CITY || "",
        coordinates: jsonData.COORDINATES || undefined,
        // Also include utilization data if needed
        utilization: jsonData.UTILIZATION ? {
            percentage: jsonData.UTILIZATION.percentage || 0,
            description: jsonData.UTILIZATION.description || "0.00% utilization"
        } : undefined
    };
}