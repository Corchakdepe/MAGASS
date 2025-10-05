'use client';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useState, useId } from 'react';

export default function SimulationForm() {
  const [duration, setDuration] = useState(25);
  const [speed, setSpeed] = useState(10);
  const [delta, setDelta] = useState(15);
  const [simulationMode, setSimulationMode] = useState('standard');
  const deltaTime = useId();

  const handleRunSimulator = async () => {
    try {
      //
      const res = await fetch(
        `http://127.0.0.1:8000/exe/${simulationMode}?number=${delta}`,
        { method: 'GET' }
      );

      if (!res.ok) throw new Error(`Request failed with ${res.status}`);

      const json = await res.json();
      console.log('Simulator response:', json);
      alert(`Simulator says: ${json.message}`);
    } catch (err) {
      console.error('Error running simulator:', err);
      alert('Failed to run simulator. Check console for details.');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium font-headline">Analysis Parameters</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox id="realtimeData" name="realtimeData"/>
          <Label htmlFor="realtimeData">Set stress</Label>
        </div>

        <div className="flex items-center space-x-3">
          <label htmlFor={deltaTime}>Delta:</label>
          <input
            id={deltaTime}
            name="deltaTime"
            type="number"
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value))}
            className="border rounded p-1 w-20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="simulationMode">Simulation Mode</Label>
          <Select
            name="simulationMode"
            defaultValue="standard"
            onValueChange={setSimulationMode}
          >
            <SelectTrigger id="simulationMode">
              <SelectValue placeholder="Select mode"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Bicicletas</SelectItem>
              <SelectItem value="aggressive">Estacion</SelectItem>
              <SelectItem value="ambos">Ambos</SelectItem>
              <SelectItem value="ninguno">Ninguno</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="duration">Simulation Duration</Label>
            <span className="text-sm text-muted-foreground">{duration}%</span>
          </div>
          <Slider
            id="duration"
            name="duration"
            value={[duration]}
            max={100}
            step={1}
            onValueChange={(value) => setDuration(value[0])}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="speed">Simulation Speed</Label>
            <span className="text-sm text-muted-foreground">{speed}%</span>
          </div>
          <Slider
            id="speed"
            name="speed"
            value={[speed]}
            max={100}
            step={1}
            onValueChange={(value) => setSpeed(value[0])}
          />
        </div>

        {/**/}
        <Button onClick={handleRunSimulator} className="mt-4">
          Run Simulator
        </Button>
      </div>
    </div>
  );
}
