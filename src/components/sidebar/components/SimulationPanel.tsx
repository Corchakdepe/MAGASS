'use client';

import {SidebarHeader, SidebarContent as SidebarBody} from '@/components/ui/sidebar';
import SimulationForm from '@/components/controls/SimulationControls/simulation-form';
import {useLanguage} from '@/contexts/LanguageContext';
import {useSimulationForm} from '../hooks/useSimulationForm';
import type {SimulationPanelProps} from '../types/sidebar';

export default function SimulationPanel({onSimulationComplete}: SimulationPanelProps) {
  const {t} = useLanguage();
  const formState = useSimulationForm(onSimulationComplete);

  // Map your existing hook props to what SimulationForm expects
  const formProps = {
    stress: formState.stress,
    setStress: formState.setStress,
    walkCost: formState.walkCost,
    setWalkCost: formState.setWalkCost,
    delta: formState.delta,
    setDelta: formState.setDelta,
    stressType: formState.stressType,
    setStressType: formState.setStressType,
    simName: formState.simName,
    setSimName: formState.setSimName,
    onRunSimulation: formState.handleRunSimulation,  // Map handleRunSimulation to onRunSimulation
    isLoading: formState.isSimulating,  // Map isSimulating to isLoading
  };

  return (
    <>
      <SidebarHeader className="border-b border-surface-3/50 px-4 py-3">
        <h3 className="text-base font-semibold">{t('runSimulation')}</h3>
      </SidebarHeader>
      <SidebarBody className="px-4 py-4">
        <SimulationForm {...formProps} />
      </SidebarBody>
    </>
  );
}
