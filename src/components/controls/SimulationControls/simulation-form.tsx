'use client';

import {useLanguage} from '@/contexts/LanguageContext';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Button} from '@/components/ui/button';
import {Play, Loader2} from 'lucide-react';

type SimulationFormProps = {
  stress: number;
  setStress: (v: number) => void;
  walkCost: number;
  setWalkCost: (v: number) => void;
  delta: number;
  setDelta: (v: number) => void;
  stressType: string;
  setStressType: (v: string) => void;
  simName: string;
  setSimName: (v: string) => void;
  onRunSimulation: () => void;  // <- THE ACTION PROP
  isLoading: boolean;  // <- THE LOADING PROP
};

export default function SimulationForm({
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
  onRunSimulation,
  isLoading,
}: SimulationFormProps) {
  const {t} = useLanguage();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-0.5">
        <div className="text-xs font-semibold text-text-primary">{t('simulationParameters')}</div>
        <div className="text-[11px] text-text-secondary">{t('nameStressWalkingCostDelta')}</div>
      </div>

      <div className="h-px w-full bg-surface-3"/>

      {/* Simulation name */}
      <div className="space-y-1">
        <Label htmlFor="simName" className="text-[11px] text-text-secondary">
          {t('simulationName')}
        </Label>
        <Input
          id="simName"
          type="text"
          value={simName}
          onChange={(e) => setSimName(e.target.value)}
          placeholder={t('simulationNamePlaceholder')}
          className="h-9 text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
        />
      </div>

      {/* Stress slider */}
      <div className="space-y-1">
        <Label htmlFor="stress" className="text-[11px] text-text-secondary">
          {t('stressLevel')}
        </Label>
        <div className="flex items-center gap-3">
          <input
            id="stress"
            type="range"
            min={0}
            max={100}
            value={stress}
            onChange={(e) => setStress(Number(e.target.value) || 0)}
            className="flex-1 accent-accent"
          />
          <span className="w-12 text-right text-xs font-medium text-text-primary">
            {stress}%
          </span>
        </div>
      </div>

      {/* Walk cost slider */}
      <div className="space-y-1">
        <Label htmlFor="walkCost" className="text-[11px] text-text-secondary">
          {t('walkCost')}
        </Label>
        <div className="flex items-center gap-3">
          <input
            id="walkCost"
            type="range"
            min={0}
            max={100}
            value={walkCost}
            onChange={(e) => setWalkCost(Number(e.target.value) || 0)}
            className="flex-1 accent-accent"
          />
          <span className="w-12 text-right text-xs font-medium text-text-primary">
            {walkCost}%
          </span>
        </div>
      </div>

      {/* Delta as number input */}
      <div className="space-y-1">
        <Label htmlFor="delta" className="text-[11px] text-text-secondary">
          {t('deltaMinutes')}
        </Label>
        <Input
          id="delta"
          type="number"
          value={delta}
          onChange={(e) => setDelta(Number(e.target.value))}
          className="h-9 text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
        />
      </div>

      {/* Stress type select */}
      <div className="space-y-1">
        <Label className="text-[11px] text-text-secondary">{t('stressType')}</Label>
        <Select value={stressType} onValueChange={(v) => setStressType(v)}>
          <SelectTrigger
            className="h-9 text-xs bg-surface-1 border border-surface-3 focus:ring-2 focus:ring-accent/25 focus:border-accent/30">
            <SelectValue placeholder={t('selectStressType')}/>
          </SelectTrigger>

          <SelectContent className="bg-surface-1 border border-surface-3 shadow-mac-panel">
            <SelectItem value="0">{t('stressTypeNone')}</SelectItem>
            <SelectItem value="1">{t('stressTypeBike')}</SelectItem>
            <SelectItem value="2">{t('stressTypeMovement')}</SelectItem>
            <SelectItem value="3">{t('stressTypeBoth')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* RUN SIMULATION BUTTON */}
      <div className="pt-2">
        <Button
          onClick={onRunSimulation}
          disabled={!simName.trim() || isLoading}
          className="w-full h-9 text-xs font-medium bg-accent hover:bg-accent/90 text-white disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('runningSimulation') || 'Running...'}
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              {t('runSimulation') || 'Run Simulation'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
