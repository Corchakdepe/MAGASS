import {useState} from 'react';

export function useSimulationForm(onSimulationComplete?: () => void) {
  const [stress, setStress] = useState(50);
  const [walkCost, setWalkCost] = useState(50);
  const [delta, setDelta] = useState(60);
  const [stressType, setStressType] = useState('0');
  const [simName, setSimName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRunSimulation = async () => {
    if (!simName.trim()) {
      alert('Please enter a simulation name');
      return;
    }

    setIsLoading(true);

    try {
      // Replace '/api/simulate' with your actual API endpoint
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: simName,
          stress: stress,
          walkCost: walkCost,
          delta: delta,
          stressType: parseInt(stressType),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Simulation failed');
      }

      const data = await response.json();
      console.log('Simulation started:', data);

      // Call the callback to refresh the simulation list
      if (onSimulationComplete) {
        onSimulationComplete();
      }

    } catch (error) {
      console.error('Error running simulation:', error);
      alert(error instanceof Error ? error.message : 'Failed to start simulation');
    } finally {
      setIsLoading(false);
    }
  };

  // Return with the correct prop names
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
    onRunSimulation: handleRunSimulation,  // <- Match the form prop name
    isLoading,  // <- Match the form prop name
  };
}
