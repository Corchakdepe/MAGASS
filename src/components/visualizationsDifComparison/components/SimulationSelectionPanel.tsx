// src/components/visualizations/directory-subtraction/SimulationSelectionPanel.tsx

"use client";

import React, { useMemo } from "react";
import {
  RefreshCw, AlertCircle, FolderOpen, ArrowRight,
  XCircle, MapPin, CheckCircle2, PlusCircle,
} from "lucide-react";
import { Simulation } from "../types/types";
import { extractParams } from "../hooks/utils";
import SimulationCard from "./SimulationCard";
import ParameterComparison from "./ParameterComparison";

interface Props {
  simulations: Simulation[];
  loading: boolean;
  error: string | null;
  selectedSim1: Simulation | null;
  selectedSim2: Simulation | null;
  onSelectSim1: (sim: Simulation | null) => void;
  onSelectSim2: (sim: Simulation | null) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  areCompatible: boolean;
  customName: string;
  onCustomNameChange: (value: string) => void;
  onSubtract: () => void;
  isSubmitting: boolean;
  subtractionError: string | null;
  onClearSelections: () => void;
  onRetry: () => void;
}

export default function SimulationSelectionPanel({
  simulations,
  loading,
  error,
  selectedSim1,
  selectedSim2,
  onSelectSim1,
  onSelectSim2,
  searchTerm,
  onSearchTermChange,
  areCompatible,
  customName,
  onCustomNameChange,
  onSubtract,
  isSubmitting,
  subtractionError,
  onClearSelections,
  onRetry,
}: Props) {
  const filteredSimulations = useMemo(() => {
    if (!searchTerm.trim()) return simulations;
    return simulations.filter(
      (sim) =>
        sim.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sim.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [simulations, searchTerm]);

  const simulationsByCity = useMemo(() => {
    const grouped: Record<string, Simulation[]> = {};
    simulations.forEach((sim) => {
      const city = sim.city || "Unknown City";
      if (!grouped[city]) grouped[city] = [];
      grouped[city].push(sim);
    });
    Object.keys(grouped).forEach((city) => {
      grouped[city].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    });
    return grouped;
  }, [simulations]);

  const handleCardSelect = (sim: Simulation) => {
    if (selectedSim1?.name === sim.name) {
      onSelectSim1(null);
    } else if (selectedSim2?.name === sim.name) {
      onSelectSim2(null);
    } else if (!selectedSim1) {
      onSelectSim1(sim);
    } else if (!selectedSim2) {
      onSelectSim2(sim);
    } else {
      onSelectSim2(sim);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-mac-panel overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-3">
        <h2 className="font-medium text-text-primary">Select Simulations</h2>
        <p className="text-xs text-text-secondary mt-1">Choose two simulations to subtract</p>
      </div>

      <div className="p-6">
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-accent/30 animate-spin" />
            <p className="text-sm text-text-secondary mt-4">Loading simulations...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-danger-soft rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-danger mb-1">Error loading simulations</p>
                <p className="text-xs text-text-secondary mb-3">{error}</p>
                <button
                  onClick={onRetry}
                  className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1"
                >
                  Try again <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && simulations.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary">No simulations found</p>
            <p className="text-xs text-text-tertiary mt-2">Run a simulation first to see results here</p>
          </div>
        )}

        {/* Main selection UI */}
        {!loading && !error && simulations.length > 0 && (
          <div className="space-y-6">
            {/* Selected summary */}
            {(selectedSim1 || selectedSim2) && (
              <div className="bg-surface-0 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Selected
                  </span>
                  <button
                    onClick={onClearSelections}
                    className="text-xs text-accent hover:text-accent-hover flex items-center gap-1"
                  >
                    <XCircle className="w-3 h-3" />
                    Clear all
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  {selectedSim1 ? (
                    <div className="flex-1 bg-white rounded-lg p-2 border border-accent/30">
                      <p className="text-xs font-medium truncate">{selectedSim1.city}</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        {extractParams(selectedSim1.name).stress} ·{" "}
                        {extractParams(selectedSim1.name).walkCost} ·
                        Δ{extractParams(selectedSim1.name).delta}
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 bg-white/50 rounded-lg p-2 border border-dashed border-surface-3">
                      <p className="text-xs text-text-tertiary">Select first...</p>
                    </div>
                  )}
                  <ArrowRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                  {selectedSim2 ? (
                    <div className="flex-1 bg-white rounded-lg p-2 border border-accent/30">
                      <p className="text-xs font-medium truncate">{selectedSim2.city}</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        {extractParams(selectedSim2.name).stress} ·{" "}
                        {extractParams(selectedSim2.name).walkCost} ·
                        Δ{extractParams(selectedSim2.name).delta}
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 bg-white/50 rounded-lg p-2 border border-dashed border-surface-3">
                      <p className="text-xs text-text-tertiary">Select second...</p>
                    </div>
                  )}
                </div>
                {selectedSim1 && selectedSim2 && (
                  <div className="mt-3">
                    <ParameterComparison sim1={selectedSim1} sim2={selectedSim2} />
                  </div>
                )}
              </div>
            )}

            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
                Search Simulations
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                placeholder="Search by city or parameters..."
                className="w-full px-3 py-2 bg-surface-0 border border-surface-3 rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>

            {/* Simulation list by city */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {Object.entries(simulationsByCity).map(([city, citySims]) => {
                const filtered = citySims.filter((sim) => filteredSimulations.includes(sim));
                if (filtered.length === 0) return null;
                return (
                  <div key={city}>
                    <h3 className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1 sticky top-0 bg-white py-1">
                      <MapPin className="w-3 h-3" />
                      {city} ({filtered.length})
                    </h3>
                    <div className="space-y-2">
                      {filtered.map((sim) => (
                        <SimulationCard
                          key={sim.name}
                          sim={sim}
                          isSelected={
                            selectedSim1?.name === sim.name || selectedSim2?.name === sim.name
                          }
                          onSelect={() => handleCardSelect(sim)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compatibility indicator */}
            {selectedSim1 && selectedSim2 && (
              <div
                className={`rounded-lg p-4 ${
                  areCompatible
                    ? "bg-success-soft border border-success/20"
                    : "bg-warning-soft border border-warning/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      areCompatible ? "bg-success/10" : "bg-warning/10"
                    }`}
                  >
                    {areCompatible ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-warning" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        areCompatible ? "text-success" : "text-warning"
                      }`}
                    >
                      {areCompatible ? "Compatible Simulations" : "Different Cities"}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {areCompatible
                        ? `Both simulations are from ${selectedSim1.city}`
                        : `${selectedSim1.city} vs ${selectedSim2.city} — subtraction may not be valid`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Custom name */}
            <div>
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
                Custom Name (Optional)
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => onCustomNameChange(e.target.value)}
                placeholder="e.g., Weekend vs Weekday Comparison"
                className="w-full px-3 py-2 bg-surface-0 border border-surface-3 rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>

            {/* Subtract button */}
            <button
              onClick={onSubtract}
              disabled={!selectedSim1 || !selectedSim2 || isSubmitting}
              className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                !selectedSim1 || !selectedSim2 || isSubmitting
                  ? "bg-surface-2 text-text-tertiary cursor-not-allowed"
                  : areCompatible
                  ? "bg-accent text-white hover:bg-accent-hover shadow-sm"
                  : "bg-warning text-white hover:bg-warning/90 shadow-sm"
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Subtract Simulations
                </>
              )}
            </button>

            {/* Subtraction error */}
            {subtractionError && (
              <div className="bg-danger-soft rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-danger mb-1">Subtraction Failed</p>
                    <p className="text-xs text-text-secondary">{subtractionError}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
