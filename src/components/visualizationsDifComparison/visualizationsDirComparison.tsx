"use client";

import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/analysis/constants";
import { Simulation, SubtractionRequest, SubtractionResponse } from "./types/types";
import DirectorySubtractionHeader from "./components/DirectorySubtractionHeader";
import SimulationSelectionPanel from "./components/SimulationSelectionPanel";
import SubtractionResultsPanel from "./components/SubtractionResultsPanel";

export default function VisualizationsDirComparison() {
  const [simulations, setSimulations]       = useState<Simulation[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [selectedSim1, setSelectedSim1]     = useState<Simulation | null>(null);
  const [selectedSim2, setSelectedSim2]     = useState<Simulation | null>(null);
  const [customName, setCustomName]         = useState("");
  const [searchTerm1, setSearchTerm1]       = useState("");   // ← split per column
  const [searchTerm2, setSearchTerm2]       = useState("");
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [subtractionResult, setSubtractionResult] = useState<SubtractionResponse | null>(null);
  const [subtractionError, setSubtractionError]   = useState<string | null>(null);

  useEffect(() => { fetchSimulations(); }, []);

  const fetchSimulations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_BASE}/exe/list-available-simulations`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      const data = await res.json();
      setSimulations(data.simulations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch simulations");
    } finally {
      setLoading(false);
    }
  };

  const areCompatible = useMemo(() => {
    if (!selectedSim1 || !selectedSim2) return true;
    return selectedSim1.city === selectedSim2.city;
  }, [selectedSim1, selectedSim2]);

  const clearSelections = () => {
    setSelectedSim1(null);
    setSelectedSim2(null);
    setCustomName("");
    setSubtractionResult(null);
    setSubtractionError(null);
  };

  const handleSubtract = async () => {
    if (!selectedSim1 || !selectedSim2) return;
    if (selectedSim1.name === selectedSim2.name) {
      alert("Please select two different simulations");
      return;
    }
    setIsSubmitting(true);
    setSubtractionError(null);
    setSubtractionResult(null);
    try {
      const body: SubtractionRequest = { folder1: selectedSim1.name, folder2: selectedSim2.name };
      if (customName.trim()) body.simname = customName.trim();
      const res = await fetch(`${API_BASE}/exe/restar-directorios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Subtraction failed: ${res.status} - ${msg}`);
      }
      const data: SubtractionResponse = await res.json();
      setSubtractionResult(data);
      setTimeout(fetchSimulations, 1000);
    } catch (err) {
      setSubtractionError(err instanceof Error ? err.message : "Failed to perform subtraction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 font-body">
      <DirectorySubtractionHeader loading={loading} onRefresh={fetchSimulations} />
      <div className="max-w-7xl mx-auto p-6 space-y-6">   {/* ← single column */}
        <SimulationSelectionPanel
          simulations={simulations}
          loading={loading}
          error={error}
          selectedSim1={selectedSim1}
          selectedSim2={selectedSim2}
          onSelectSim1={setSelectedSim1}
          onSelectSim2={setSelectedSim2}
          searchTerm1={searchTerm1}
          searchTerm2={searchTerm2}
          onSearchTerm1Change={setSearchTerm1}
          onSearchTerm2Change={setSearchTerm2}
          areCompatible={areCompatible}
          customName={customName}
          onCustomNameChange={setCustomName}
          onSubtract={handleSubtract}
          isSubmitting={isSubmitting}
          subtractionError={subtractionError}
          onClearSelections={clearSelections}
          onRetry={fetchSimulations}
        />
        <SubtractionResultsPanel
          subtractionResult={subtractionResult}
          onNewSubtraction={clearSelections}
          onRefreshList={fetchSimulations}
        />
      </div>
    </div>
  );
}
