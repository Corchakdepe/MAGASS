// components/sidebar-content-upload-sim.tsx
'use client';

import {useState} from 'react';
import {useToast} from '@/hooks/use-toast';
import SimulationForm from '@/components/simulation-form';
import {Button} from '@/components/ui/button';
import {
    SidebarHeader,
    SidebarContent as SidebarBody,
    SidebarFooter,
} from '@/components/ui/sidebar';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import type {SimulationData} from '@/types/simulation';

type SidebarContentProps = {
    onSimulationComplete: (data: SimulationData | any) => void;
};

export default function SidebarContentUploadSim({
                                                    onSimulationComplete,
                                                }: SidebarContentProps) {
    const {toast} = useToast();
    const [isSimulating, setIsSimulating] = useState(false);

    const [folderPath, setFolderPath] = useState('./Datos/Marzo_Reales');
    const [outputPath, setOutputPath] = useState(''); // ahora opcional
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
            // si el usuario no pone nada, usamos una ruta por defecto
            const resolvedOutput =
                outputPath.trim().length > 0 ? outputPath.trim() : './results';

            const body = {
                ruta_entrada: folderPath,
                ruta_salida: outputPath.trim() || null,  // ahora permitido
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

            toast({
                title: 'Simulation Complete',
                description: 'Simulation finished successfully',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description:
                    error instanceof Error ? error.message : 'Simulation failed',
            });
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <>
            <SidebarHeader className="p-4">
                <h2 className="text-xl font-semibold font-headline">Simulation</h2>
                <h3 className="text-s font-light font-headline">
                    Input folder & parameters
                </h3>
            </SidebarHeader>

            <SidebarBody className="p-4 space-y-6 overflow-y-auto">
                {/* Input folder obligatorio */}
                <div className="space-y-1">
                    <Label htmlFor="folderPath">Input folder</Label>
                    <Input
                        id="folderPath"
                        value={folderPath}
                        onChange={e => setFolderPath(e.target.value)}
                        placeholder="./Datos/Marzo_Reales"
                    />
                </div>
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
            </SidebarBody>

            <SidebarFooter className="p-4 border-t">
                <Button
                    onClick={handleRunSimulation}
                    className="w-full"
                    disabled={isSimulating}
                >
                    {isSimulating ? 'Running Simulation...' : 'Run Simulation'}
                </Button>
            </SidebarFooter>
        </>
    );
}
