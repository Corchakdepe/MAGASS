'use client';

import {useState} from 'react';
import {useToast} from '@/hooks/use-toast';
import SimulationForm from '@/components/simulation-form';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import type {SimulationData} from '@/types/simulation';

type UploadSimPanelProps = {
    onSimulationComplete: (data: SimulationData | any) => void;
};

export default function UploadSimPanel({onSimulationComplete}: UploadSimPanelProps) {
    const {toast} = useToast();
    const [isSimulating, setIsSimulating] = useState(false);

    const [folderPath, setFolderPath] = useState('./Datos/Marzo_Reales');
    const [outputPath, setOutputPath] = useState('');
    const [simName, setSimName] = useState('');
    const [stress, setStress] = useState(0);
    const [walkCost, setWalkCost] = useState(100);
    const [delta, setDelta] = useState(15);
    const [stressType, setStressType] = useState('0');

    const handleRunSimulation = async () => {
        if (!folderPath.trim()) {
            toast({
                variant: 'destructive',
                title: 'Folder Required',
                description: 'Please enter a valid input folder path.',
            });
            return;
        }

        setIsSimulating(true);
        try {
            const body = {
                ruta_entrada: folderPath,
                ruta_salida: outputPath.trim() || null,
                stress_type: Number(stressType),
                stress: stress / 100,
                walk_cost: walkCost / 100,
                delta,
                dias: null,
                simname: simName || null,
            };

            const response = await fetch('http://127.0.0.1:8000/exe/simular-json', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || 'Simulation failed');
            }

            const result = await response.json();
            onSimulationComplete(result);

            toast({title: 'Simulation Complete', description: 'Simulation finished successfully'});
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error instanceof Error ? error.message : 'Simulation failed',
            });
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <div
            className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-4 space-y-4">
            <div className="space-y-0.5">
                <div className="text-xs font-semibold text-text-primary">Simulation</div>
                <div className="text-[11px] text-text-secondary">Input folder & parameters</div>
            </div>

            <div className="h-px w-full bg-surface-3"/>

            <div className="space-y-1">
                <Label htmlFor="folderPath" className="text-[11px] text-text-secondary">
                    Input folder
                </Label>
                <Input
                    id="folderPath"
                    value={folderPath}
                    onChange={(e) => setFolderPath(e.target.value)}
                    placeholder="./Datos/Marzo_Reales"
                    className="h-9 text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                />
            </div>

            {/* Keep SimulationForm as-is; just give it a clean section wrapper (not a Card) */}
            <div className="rounded-lg border border-surface-3 bg-surface-0/60 p-3">
                <SimulationForm
                    stress={stress}
                    setStress={setStress}
                    walkCost={walkCost}
                    setWalkCost={setWalkCost}
                    delta={delta}
                    setDelta={setDelta}
                    stressType={stressType}
                    setStressType={setStressType}
                    setSimName={setSimName}
                    simName={simName}
                />
            </div>

            <div className="pt-1">
                <Button
                    onClick={handleRunSimulation}
                    disabled={isSimulating}
                    className="w-full bg-accent text-text-inverted hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
                >
                    {isSimulating ? "Running Simulation..." : "Run Simulation"}
                </Button>

                <div className="mt-2 text-[10px] text-text-tertiary">
                    {isSimulating ? "Executing simulation request…" : "Ready."}
                </div>
            </div>
        </div>
    );

}
