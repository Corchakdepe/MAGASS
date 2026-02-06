import {useState} from 'react';
import {API_BASE} from "@/lib/analysis/constants";

export function useSimulationForm(onSimulationComplete?: () => void) {
  const [stress, setStress] = useState(50); // 0-100%
  const [walkCost, setWalkCost] = useState(50); // 0-100%
  const [delta, setDelta] = useState(60); // in minutes
  const [stressType, setStressType] = useState('0');
  const [simName, setSimName] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [outputPath, setOutputPath] = useState('');

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
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Upload successful:', data);

      // Use the path returned by the backend
      const uploadPath = data.upload_path || data.uploadPath || './uploads';
      setFolderPath(uploadPath);
      setUploadedFiles(files);

      // Generate a default output path based on simulation name
      if (simName.trim()) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        setOutputPath(`./results/${simName}_${timestamp}`);
      }

      return uploadPath;
    } catch (error) {
      console.error('Error uploading files:', error);
      alert(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      // Prepare data in the EXACT format backend expects
      const requestBody = {
        ruta_entrada: folderPath,
        ruta_salida: outputPath.trim() || null,
        stress_type: Number(stressType),
        stress: stress / 100,  // Convert percentage to decimal (0-1)
        walk_cost: walkCost / 100,  // Convert percentage to decimal (0-1)
        delta: delta,
        dias: null,  // Or "all" if that's what your backend expects
        simname: simName.trim() || null,
      };

      console.log('Sending simulation request:', requestBody);

      // Use the correct endpoint - adjust if needed
      const response = await fetch(`${API_BASE}/exe/simular-json`, {  // Or '/api/'
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });



      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || errorData.message || `Simulation failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Simulation started successfully:', data);

      // Reset form on success
      setSimName('');
      setFolderPath('');
      setOutputPath('');
      setUploadedFiles([]);

      // Trigger refresh of simulation list
      if (onSimulationComplete) {
        onSimulationComplete();
      }

      return data;

    } catch (error) {
      console.error('Error running simulation:', error);
      alert(`Simulation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
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
    outputPath,
    setOutputPath,
    uploadedFiles,
    handleFileUpload,
    onRunSimulation: handleRunSimulation,
    isLoading,
  };
}