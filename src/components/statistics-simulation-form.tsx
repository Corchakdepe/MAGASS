// components/statistics-simulation-form.tsx
'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type StatisticsSimulationFormProps = {
  stress: number;
  setStress: (v: number) => void;
  walkCost: number;
  setWalkCost: (v: number) => void;
  delta: number;
  setDelta: (v: number) => void;
  stressType: string;
  setStressType: (v: string) => void;
};

export default function StatisticsSimulationForm({
  stress,
  setStress,
  walkCost,
  setWalkCost,
  delta,
  setDelta,
  stressType,
  setStressType,
}: StatisticsSimulationFormProps) {
  return (
    <div className="space-y-4">
      {/* Stress slider */}
      <div className="space-y-1">
        <Label htmlFor="stress">Stress level (%)</Label>
        <div className="flex items-center gap-3">
          <input
            id="stress"
            type="range"
            min={0}
            max={100}
            value={stress}
            onChange={(e) => setStress(Number(e.target.value) || 0)}
            className="flex-1"
          />
          <span className="w-12 text-right text-sm">{stress}%</span>
        </div>
      </div>

      {/* Walk cost slider */}
      <div className="space-y-1">
        <Label htmlFor="walkCost">Walk cost (%)</Label>
        <div className="flex items-center gap-3">
          <input
            id="walkCost"
            type="range"
            min={0}
            max={100}
            value={walkCost}
            onChange={(e) => setWalkCost(Number(e.target.value) || 0)}
            className="flex-1"
          />
          <span className="w-12 text-right text-sm">{walkCost}%</span>
        </div>
      </div>

      {/* Delta as number input */}
      <div className="space-y-1">
        <Label htmlFor="delta">Delta (minutes)</Label>
        <Input
          id="delta"
          type="number"
          min={1}
          value={delta}
          onChange={(e) => setDelta(Number(e.target.value) || 1)}
        />
      </div>

      {/* Stress type select */}
      <div className="space-y-1">
        <Label>Stress type</Label>
        <Select
          value={stressType}
          onValueChange={(v) => setStressType(v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select stress type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Ninguno</SelectItem>
            <SelectItem value="1">Bicicleta</SelectItem>
            <SelectItem value="2">Movimiento</SelectItem>
            <SelectItem value="3">Ambos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
