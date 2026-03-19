// src/components/visualizations/directory-subtraction/utils.ts

import { SimulationParams } from "../types/types";

export const extractParams = (simName: string): SimulationParams => {
  const defaultParams: SimulationParams = {
    stressType: "0",
    stress: "0%",
    walkCost: "0%",
    delta: "15",
  };

  try {
    const match = simName.match(/_sim_ST(\d+)_S([\d.]+)_WC([\d.]+)_D(\d+)/);
    if (match) {
      const [, stressType, stress, walkCost, delta] = match;
      const fmt = (v: string) => {
        const n = parseFloat(v);
        return n === 0 ? "0%" : `${n}%`;
      };
      return { stressType, stress: fmt(stress), walkCost: fmt(walkCost), delta };
    }
  } catch (e) {
    console.error("Error parsing simulation name:", e);
  }

  return defaultParams;
};

export const formatDate = (timestamp: string): string => {
  if (timestamp === "unknown") return "Unknown date";
  try {
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hours = timestamp.substring(9, 11);
    const minutes = timestamp.substring(11, 13);
    const seconds = timestamp.substring(13, 15);
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return timestamp;
  }
};
