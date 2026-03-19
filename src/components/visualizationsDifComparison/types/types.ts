// src/components/visualizations/directory-subtraction/types.ts

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
