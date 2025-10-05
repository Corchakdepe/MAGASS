'use client';

import { useTransition, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { runSimulationAction } from '@/lib/actions';
import FileUpload from '@/components/file-upload';
import SimulationForm from '@/components/simulation-form';
import { Button } from '@/components/ui/button';
import {
  SidebarHeader,
  SidebarContent as SidebarBody,
  SidebarFooter,
} from '@/components/ui/sidebar';
import type { SimulationData } from './app-layout';

type SidebarContentProps = {
  setSimulationData: (data: SimulationData | null) => void;
  isSimulating: boolean;
  setIsSimulating: (isSimulating: boolean) => void;
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
};

export default function SidebarContentComponent({
  setSimulationData,
  isSimulating,
  setIsSimulating,
  uploadedFiles,
  setUploadedFiles,
}: SidebarContentProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setIsSimulating(isPending);
  }, [isPending, setIsSimulating]);

  const handleSubmit = (formData: FormData) => {
    if (uploadedFiles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Upload Required',
        description: 'Please upload at least one data file to run the simulation.',
      });
      return;
    }

    uploadedFiles.forEach((file) => {
      formData.append('files', file);
    });

    startTransition(() => {
      (async () => {
        const result = await runSimulationAction(null, formData);

        if (result.data) {
          setSimulationData(result.data as SimulationData); // cast if needed
          toast({
            title: 'Simulation Complete',
            description: 'The simulation has finished successfully.',
          });
        } else if (result.error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error,
          });
        }
      })();
    });
  };

  return (
    <>
      <SidebarHeader>
        <h2 className="text-xl font-semibold font-headline">BikeSim Studio</h2>
      </SidebarHeader>
      <SidebarBody>
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            if (formRef.current) {
              const formData = new FormData(formRef.current);
              handleSubmit(formData);
            }
          }}
          className="flex flex-col h-full"
        >
          <div className="flex-grow p-4 space-y-6 overflow-y-auto">
            <FileUpload uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} />
            <SimulationForm />
          </div>
          <SidebarFooter className="p-4 border-t">
            <Button type="submit" className="w-full" disabled={isSimulating}>
              {isSimulating ? 'Running Simulation...' : 'Run Simulation'}
            </Button>
          </SidebarFooter>
        </form>
      </SidebarBody>
    </>
  );
}
