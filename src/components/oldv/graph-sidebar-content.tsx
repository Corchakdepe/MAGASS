'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/oldv/file-upload';
import StatisticsSimulationForm from '@/components/oldv/statistics-form';
import { Button } from '@/components/ui/button';
import {
  SidebarHeader,
  SidebarContent as SidebarBody,
  SidebarFooter,
} from '@/components/ui/sidebar';
import type { SimulationData } from '@/types/simulation';

type SidebarContentProps = {
  onSimulationComplete: (data: SimulationData) => void;
};

export default function SidebarContentUpload({ onSimulationComplete }: SidebarContentProps) {
  const { toast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [folderPath, setFolderPath] = useState('./Datos/Marzo_Reales');

  const [stress, setStress] = useState(0);
  const [walkCost, setWalkCost] = useState(100);
  const [delta, setDelta] = useState(15);
  const [stressType, setStressType] = useState('0');

  const handleRunSimulation = async () => {
    if (!folderPath.trim()) {
      toast({
        variant: 'destructive',
        title: 'Folder Required',
        description: 'Please enter a valid folder path.',
      });
      return;
    }

    setIsSimulating(true);

    try {
      const params = new URLSearchParams({
        folderPath: folderPath,
        stressType: stressType,
        stress: (stress / 100).toString(),
        walkCost: (walkCost / 100).toString(),
        delta: delta.toString(),
      });

      const response = await fetch(
        `http://127.0.0.1:8000/exe/simular?${params.toString()}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Simulation failed');
      }

      const result = await response.json();

      onSimulationComplete(result);

      toast({
        title: 'Simulation Complete',
        description: `Results saved to ${result.output_folder_name}`,
      });
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
    <>
      <SidebarHeader className="p-4">
        <h2 className="text-xl font-semibold font-headline">Simulation</h2>
        <h3 className="text-s font-light font-headline">Upload and Parameters</h3>
      </SidebarHeader>
      <SidebarBody className="p-4 space-y-6 overflow-y-auto">
        <StatisticsSimulationForm
          stress={stress}
          setStress={setStress}
          walkCost={walkCost}
          setWalkCost={setWalkCost}
          delta={delta}
          setDelta={setDelta}
          stressType={stressType}
          setStressType={setStressType}
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
