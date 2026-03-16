// components/sidebar/components/FiltersAnalysisPanel.tsx
"use client";

import * as React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMapsAnalysisState } from "../hooks/useMapsAnalysisState";
import { MapsAndGraphsFilterControls } from "@/components/controls/FilterControls/MapsAndGraphsFilterControls";
import { FilterResultsDisplay } from "@/components/controls/FilterControls/components/FilterResultsDisplay";
import { useFilterCreation } from "@/components/controls/FilterControls/hooks/useFilterCreation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import type { DateRange } from "react-day-picker";

interface FiltersAnalysisPanelProps {
  runId?: string;
}

export default function FiltersAnalysisPanel({ runId }: FiltersAnalysisPanelProps) {
  const { t } = useLanguage();

  const [state, actions, uiHydrated] = useMapsAnalysisState(runId);
  const [daysRange, setDaysRange] = React.useState<DateRange | undefined>();

  const dateDiffInDays = (to: Date, from: Date) => {
    const diffTime = to.getTime() - from.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const {
    createFilter,
    isCreating,
    error,
    lastResponse,
    reset
  } = useFilterCreation({
    runId: runId || '',
    filterKind: state.filterKind,
    filterState: state.filterState,
    daysRange,
    onSuccess: (response) => {
      console.log('Filter created successfully:', response);
    },
    onError: (err) => {
      console.error('Filter creation failed:', err);
    }
  });

  const handleCreateFilter = async () => {
    await createFilter();
  };

  const handleDownload = (filename: string) => {
    if (!runId) return;
    window.open(`/api/results/${runId}/${filename}`, '_blank');
  };

  const handleCopy = (data: number[]) => {
    // Already handled by the component
  };

  if (!uiHydrated) {
    return (
      <div className="h-full flex items-center justify-center text-text-secondary">
        {t('loading')}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface-0">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-surface-3">
        <h3 className="text-sm font-bold text-text-primary mb-1">
          {t('filterConfiguration')}
        </h3>
        <p className="text-xs text-text-secondary">
          {t('createAndSaveFiltersForAnalysis')}
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
        {/* Filter Controls */}
        <MapsAndGraphsFilterControls
          useFilterForMaps={state.useFilterForMaps}
          setUseFilterForMaps={actions.setUseFilterForMaps}
          filterKind={state.filterKind}
          setFilterKind={actions.setFilterKind}
          filterState={state.filterState}
          setFilterState={actions.setFilterState}
          daysRange={daysRange}
          setDaysRange={setDaysRange}
          dateDiffInDays={dateDiffInDays}
        />

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="bg-danger/10 border-danger/30">
            <AlertCircle className="h-4 w-4 text-danger" />
            <AlertDescription className="text-xs text-danger">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        {lastResponse && (
          <FilterResultsDisplay
            response={lastResponse}
            onDownload={handleDownload}
            onCopy={handleCopy}
          />
        )}
      </div>

      {/* Footer with action button */}
      <div className="shrink-0 p-4 border-t border-surface-3 bg-surface-1/50">
        <Button
          onClick={handleCreateFilter}
          disabled={isCreating || !runId}
          className="w-full bg-accent text-text-inverted hover:bg-accent-hover"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('creating')}
            </>
          ) : (
            t('createFilterFile')
          )}
        </Button>
        {lastResponse && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs text-text-secondary"
            onClick={reset}
          >
            {t('createNewFilter')}
          </Button>
        )}
      </div>
    </div>
  );
}