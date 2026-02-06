import {useState} from 'react';
import {API_BASE} from "@/lib/analysis/constants";

export function useSimulationForm(onSimulationComplete?: () => void) {
  const [stress, setStress] = useState(50);
  const [walkCost, setWalkCost] = useState(50);
  const [delta, setDelta] = useState(60);
  const [stressType, setStressType] = useState('0');
  const [simName, setSimName] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return null;

    setIsLoading(true);
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      // Upload files to backend
      const response = await fetch(`${API_BASE}/upload-files`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      console.log('Upload successful:', data);

      // Use the path returned by the backend
      const uploadPath = data.upload_path || data.uploadPath || './uploads';
      setFolderPath(uploadPath);
      setUploadedFiles(files);

      return uploadPath;
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSimulation = async () => {
    if (!simName.trim()) {
      alert('Please enter a simulation name');
      return;
    }

    if (!folderPath) {
      alert('Please upload CSV files first');
      return;
    }

    setIsLoading(true);

    try {
      // Use the correct endpoint and format
      const response = await fetch(`${API_BASE}/exe/simular-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          simname: simName,
          stress: stress,
          walk_cost: walkCost,
          delta: delta,
          stress_type: parseInt(stressType),
          ruta_entrada: folderPath,
          ruta_salida: '',
          dias: null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || error.message || 'Simulation failed');
      }

      const data = await response.json();
      console.log('Simulation started:', data);

      // Call the callback to refresh the simulation list
      if (onSimulationComplete) {
        onSimulationComplete();
      }

    } catch (error) {
      console.error('Error running simulation:', error);
      alert(error instanceof Error ? error.message : 'Failed to start simulation');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stress,
    setStress,
    walkCost,
    setWalkCost,
    delta,
    setDelta,
    stressType,
    setStressType,
    simName,
    setSimName,
    folderPath,
    setFolderPath,
    uploadedFiles,
    handleFileUpload,
    onRunSimulation: handleRunSimulation,
    isLoading,
  };
}