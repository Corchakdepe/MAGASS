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

    // Helper function to generate initial map
    const generateInitialMap = async (runId: string) => {
        try {
            console.log('Generating initial map for run:', runId);

            const mapRequest = {
                input_folder: `./results/${runId}`,
                output_folder: `./results/${runId}`,
                seleccion_agregacion: "0",
                delta_media: null,
                delta_acumulada: null,
                graf_barras_est_med: null,
                graf_barras_est_acum: null,
                graf_barras_dia: null,
                graf_linea_comp_est: null,
                graf_linea_comp_mats: null,
                mapa_densidad: null,
                video_densidad: null,
                mapa_voronoi: null,
                mapa_circulo: "0",
                mapa_desplazamientos: null,
                filtrado_EstValor: null,
                filtrado_EstValorDias: null,
                filtrado_Horas: null,
                filtrado_PorcentajeEstaciones: null,
                filtro: null,
                tipo_filtro: null,
            };

            const response = await fetch(`${API_BASE}/dashboard/mapainicial`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(mapRequest),
            });

            if (!response.ok) {
                console.warn('Map generation failed');
                return null;
            }

            const data = await response.json();
            console.log('Map generation successful:', data);
            return data;
        } catch (error) {
            console.warn('Error generating map:', error);
            return null;
        }
    };

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

            // Extract run ID from output_folder_name
            let runId = null;

            // First check for output_folder_name
            if (data.output_folder_name) {
                // Extract the folder name from the full path
                // Path format: "/Users/ageudepetris/Desktop/TFG project/results/20260207_140032_sim_ST0_S50.00_WC50.00_D60"
                const pathParts = data.output_folder_name.split('/');
                if (pathParts.length > 0) {
                    runId = pathParts[pathParts.length - 1]; // Get the last part (folder name)
                    console.log('Extracted run ID from output_folder_name:', runId);
                }
            }

            // Fallback to other fields if needed
            if (!runId && data.runId) {
                runId = data.runId;
            } else if (!runId && data.simfolder) {
                runId = data.simfolder;
            } else if (!runId && data.simname) {
                runId = data.simname;
            } else if (!runId && typeof data === 'string') {
                runId = data;
            }

            // Generate map if we have a run ID
            if (runId) {
                console.log('Attempting to generate map for run:', runId);
                // Run in background, don't wait for completion
                generateInitialMap(runId)
                    .then((result) => {
                        if (result) {
                            console.log('Map generation completed successfully');
                        } else {
                            console.log('Map generation attempted but returned no result');
                        }
                    })
                    .catch((error) => console.warn('Map generation failed:', error));
            } else {
                console.warn('No run ID found for map generation');
            }

            // Call the callback to refresh the simulation list
            if (onSimulationComplete) {
                onSimulationComplete();
            }

            return data;

        } catch (error) {
            console.error('Error running simulation:', error);
            alert(error instanceof Error ? error.message : 'Failed to start simulation');
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
        uploadedFiles,
        handleFileUpload,
        onRunSimulation: handleRunSimulation,
        isLoading,
    };
}