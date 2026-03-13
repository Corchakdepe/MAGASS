// src/components/visualizations/directory-subtraction/components/SimulationSelectionPanel.tsx
"use client";

import React, { useState } from "react";
import {
  Search, Play, Loader2, XCircle, AlertTriangle, X, CheckCircle2, RefreshCw,
} from "lucide-react";
import { Simulation } from "../types/types";
import SimulationCard from "./SimulationCard";
import ParameterComparison from "./ParameterComparison";
import { extractParams } from "../hooks/utils";

interface Props {
  simulations: Simulation[];
  loading: boolean;
  error: string | null;
  selectedSim1: Simulation | null;
  selectedSim2: Simulation | null;
  onSelectSim1: (s: Simulation | null) => void;
  onSelectSim2: (s: Simulation | null) => void;
  searchTerm1: string;
  searchTerm2: string;
  onSearchTerm1Change: (v: string) => void;
  onSearchTerm2Change: (v: string) => void;
  areCompatible: boolean;
  customName: string;
  onCustomNameChange: (v: string) => void;
  onSubtract: () => void;
  isSubmitting: boolean;
  subtractionError: string | null;
  onClearSelections: () => void;
  onRetry: () => void;
}

// ── Reusable column picker ─────────────────────────────────────────────────────

function SimColumnPicker({
  label,
  accent,
  simulations,
  loading,
  error,
  selected,
  onSelect,
  disabledName,
  searchTerm,
  onSearchTermChange,
  onRetry,
}: {
  label: string;
  accent: boolean;
  simulations: Simulation[];
  loading: boolean;
  error: string | null;
  selected: Simulation | null;
  onSelect: (s: Simulation | null) => void;
  disabledName?: string;
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  onRetry: () => void;
}) {
  const filtered = simulations.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-surface-1 rounded-xl shadow-mac-panel overflow-hidden">

      {/* Column header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-2">
        <span className={`
          w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0
          ${accent ? "bg-accent text-white" : "bg-surface-3 text-text-secondary"}
        `}>
          {label}
        </span>
        <span className="text-sm font-semibold text-text-primary">
          {label === "A" ? "Base" : "Subtract"}
        </span>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="ml-auto text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Selected preview */}
      {selected && (
        <div className={`px-4 py-2.5 border-b border-surface-2 ${accent ? "bg-accent/5" : "bg-surface-2/50"}`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${accent ? "text-accent" : "text-success"}`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">{selected.city}</p>
              <p className="text-[10px] text-text-tertiary font-code truncate">{selected.name.substring(0, 28)}…</p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-3 py-2 border-b border-surface-2">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-2">
          <Search className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Search…"
            className="flex-1 bg-transparent text-xs text-text-primary
                       placeholder:text-text-tertiary outline-none"
          />
          {searchTerm && (
            <button type="button" onClick={() => onSearchTermChange("")}>
              <X className="w-3 h-3 text-text-tertiary hover:text-text-secondary" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto max-h-96 divide-y divide-surface-2/50">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-text-tertiary">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        )}
        {error && !loading && (
          <div className="p-4 space-y-2">
            <p className="text-xs text-danger">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="py-10 text-center text-xs text-text-tertiary">
            No simulations match
          </div>
        )}
        {!loading && !error && filtered.map((sim) => {
          const isDisabled = sim.name === disabledName;
          return (
            <div
              key={sim.name}
              className={isDisabled ? "opacity-40 pointer-events-none" : ""}
            >
              <SimulationCard
                sim={sim}
                isSelected={selected?.name === sim.name}
                onSelect={() => onSelect(selected?.name === sim.name ? null : sim)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────

export default function SimulationSelectionPanel({
  simulations, loading, error,
  selectedSim1, selectedSim2,
  onSelectSim1, onSelectSim2,
  searchTerm1, searchTerm2,
  onSearchTerm1Change, onSearchTerm2Change,
  areCompatible,
  customName, onCustomNameChange,
  onSubtract, isSubmitting,
  subtractionError,
  onClearSelections, onRetry,
}: Props) {
  return (
    <div className="space-y-4">

      {/* ── A − B horizontal row ── */}
      <div className="flex items-stretch gap-3">

        <SimColumnPicker
          label="A" accent
          simulations={simulations} loading={loading} error={error}
          selected={selectedSim1} onSelect={onSelectSim1}
          disabledName={selectedSim2?.name}
          searchTerm={searchTerm1} onSearchTermChange={onSearchTerm1Change}
          onRetry={onRetry}
        />

        {/* Operator divider */}
        <div className="flex flex-col items-center justify-center gap-2 py-4 shrink-0">
          <div className="w-px flex-1 bg-surface-3" />
          <div className="w-9 h-9 rounded-full border-2 border-surface-3 bg-surface-1
                          flex items-center justify-center shadow-sm
                          text-lg font-bold text-text-secondary select-none">
            −
          </div>
          <div className="w-px flex-1 bg-surface-3" />
        </div>

        <SimColumnPicker
          label="B" accent={false}
          simulations={simulations} loading={loading} error={error}
          selected={selectedSim2} onSelect={onSelectSim2}
          disabledName={selectedSim1?.name}
          searchTerm={searchTerm2} onSearchTermChange={onSearchTerm2Change}
          onRetry={onRetry}
        />
      </div>

      {/* ── Incompatibility warning ── */}
      {!areCompatible && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl
                        border border-warning/30 bg-warning-soft">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <p className="text-xs text-text-secondary">
            Selected simulations are from different cities — subtraction may not be valid.
          </p>
        </div>
      )}

      {/* ── Parameter diff ── */}
      {selectedSim1 && selectedSim2 && (
        <ParameterComparison sim1={selectedSim1} sim2={selectedSim2} />
      )}

      {/* ── Action bar ── */}
      <div className="bg-surface-1 rounded-xl shadow-mac-panel p-4 space-y-3">
        {/* Custom name */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-sm font-medium text-text-primary">
              Output Name
              <span className="ml-1.5 text-xs font-normal text-text-tertiary">optional</span>
            </span>
            <p className="text-xs text-text-secondary mt-0.5">Appended to the result folder</p>
          </div>
          <input
            type="text"
            value={customName}
            onChange={(e) => onCustomNameChange(e.target.value)}
            placeholder="e.g. delta-comparison"
            maxLength={40}
            className="w-40 px-2.5 py-1.5 rounded-md border border-surface-3 bg-surface-1
                       text-sm text-text-primary placeholder:text-text-tertiary shadow-sm
                       outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                       transition-all font-code"
          />
        </div>

        {/* Error */}
        {subtractionError && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl
                          border border-danger/30 bg-danger-soft">
            <XCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
            <p className="text-xs text-text-secondary break-all">{subtractionError}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClearSelections}
            disabled={!selectedSim1 && !selectedSim2}
            className="px-4 h-10 rounded-lg text-sm font-medium border border-surface-3
                       bg-surface-1 text-text-secondary hover:bg-surface-2
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onSubtract}
            disabled={!selectedSim1 || !selectedSim2 || isSubmitting}
            className="flex-1 h-10 rounded-lg text-sm font-semibold flex items-center
                       justify-center gap-2 transition-all active:scale-[0.98]
                       bg-accent hover:bg-accent-hover text-white shadow-sm
                       disabled:bg-surface-2 disabled:text-text-tertiary
                       disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isSubmitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Subtracting…</>
              : <><Play className="w-4 h-4" /> Run A − B</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
