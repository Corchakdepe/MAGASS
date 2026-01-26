'use server';


import { promises as fs } from 'fs';
import path from 'path';

export async function runSimulationAction(_: any, formData: FormData) {
  try {
    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return { error: 'No files uploaded' };
    }

    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const savedFiles: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = path.join(uploadDir, file.name);
      await fs.writeFile(filePath, buffer);
      savedFiles.push(filePath);
    }

    // Call FastAPI backend and wait for it to finish the simulation
    const response = await fetch('http://127.0.0.1:8000/exe/simular', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      //body: JSON.stringify({ files: savedFiles }),
      //body works only with POST, future repair
    });

    if (!response.ok) {
      throw new Error(`Simulation failed: ${response.statusText}`);
    }

    // Parse the JSON response from FastAPI
    const simulationResult: SimulationData = await response.json();

    return { data: simulationResult, error: null };
  } catch (err: any) {
    return { error: err.message || 'Unknown error while saving files' };
  }
}

export async function getAiSuggestionsAction(fileNames: string[]) {
  if (fileNames.length === 0) {
    return {
      data: null,
      error: 'Please upload at least one file to get AI suggestions.',
    };
  }

  try {
    const result = await suggestSimulationParameters({ uploadedFiles: fileNames });
    return { data: result, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: 'Failed to get AI suggestions.' };
  }
}
