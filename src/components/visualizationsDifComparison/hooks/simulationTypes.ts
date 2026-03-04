// src/components/visualizations/directory-subtraction/simulationTypes.ts

export interface Simulation {
  name: string;
  path: string;
  timestamp: string;
  city: string;
  display_name: string;
}

export interface SimulationParams {
  stressType: string;
  stress: string;
  walkCost: string;
  delta: string;
}

export interface SubtractionRequest {
  folder1: string;
  folder2: string;
  simname?: string;
}

export interface SubtractionResponse {
  ok: boolean;
  output_folder: string;
  output_path: string;
  files_created: number;
  message: string;
}

export const extractParams = (simName: string): SimulationParams => {
  const defaultParams = {
    stressType: "0",
    stress: "0%",
    walkCost: "0%",
    delta: "15",
  };

  try {
    const match = simName.match(/_sim_ST(\d+)_S([\d.]+)_WC([\d.]+)_D(\d+)/);

    if (match) {
      const [, stressType, stress, walkCost, delta] = match;

      const formatPercent = (value: string) => {
        const num = parseFloat(value);
        return num === 0 ? "0%" : `${num}%`;
      };

      return {
        stressType,
        stress: formatPercent(stress),
        walkCost: formatPercent(walkCost),
        delta,
      };
    }
  } catch (e) {
    console.error("Error parsing simulation name:", e);
  }

  return defaultParams;
};

export const formatDate = (timestamp: string) => {
  if (timestamp === "unknown") return "Unknown date";
  try {
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const time = timestamp.substring(9, 15);
    const hours = time.substring(0, 2);
    const minutes = time.substring(2, 4);
    const seconds = time.substring(4, 6);
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return timestamp;
  }
};
