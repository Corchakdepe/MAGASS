"use client";

import * as React from "react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useLanguage} from "@/contexts/LanguageContext";
import {useMapsAnalysisState} from "../hooks/useMapsAnalysisState";
import {useMapsAnalysis} from "../hooks/useMapsAnalysis";
import {useQuickGraphs} from "../hooks/useQuickGraphs";
import {useDeltaCalculation} from "../hooks/useDeltaCalculation";
import {MapsTab} from "./tabsMaps/MapsTab";
import {FilterTab} from "./tabsMaps/FilterTab";
import {MatrixTab} from "./tabsMaps/MatrixTab";
import {ActionsTab} from "./tabsMaps/ActionsTab";
import type {MapsAnalysisPanelProps} from "../types/mapsAnalysis";

export default function MapsAnalysisPanel({
  runId,
  externalStationsMaps,
  onClearExternalStationsMaps,
  activeStationsTargetKey,
  onActiveStationsTargetKeyChange,
}: MapsAnalysisPanelProps) {
  const {t} = useLanguage();

  const [state, actions, uiHydrated] = useMapsAnalysisState(runId, externalStationsMaps);

  const {
    apiBusy,
    apiError,
    handleAnalyze,
    inputFolder,
    outputFolder,
  } = useMapsAnalysis(runId, state);

  const {
    apiBusy: quickGraphBusy,
    apiError: quickGraphError,
    handleCreateQuickGraph,
  } = useQuickGraphs(runId, state, inputFolder, outputFolder);

  const {deltaAutoSource, deltaLoading} = useDeltaCalculation(runId);

  if (!uiHydrated) {
    return (
      <div className="h-full flex items-center justify-center text-text-secondary">
        {t('loading')}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface-0">
      <Tabs defaultValue="maps" className="flex-1 flex flex-col min-h-0">
        {/* Header strip - Fixed at top with more compact design */}
        <div className="shrink-0 border-b border-surface-3 bg-surface-1/80 backdrop-blur-sm px-4 py-1.5">
          <TabsList className="w-full grid grid-cols-4 bg-surface-2/50">
            <TabsTrigger
              value="maps"
              className="text-xs data-[state=active]:bg-accent data-[state=active]:text-white"
            >
              {t('maps')}
            </TabsTrigger>
            <TabsTrigger
              value="filter"
              className="text-xs data-[state=active]:bg-accent data-[state=active]:text-white"
            >
              {t('filter')}
            </TabsTrigger>
            <TabsTrigger
              value="matrix"
              className="text-xs data-[state=active]:bg-accent data-[state=active]:text-white"
            >
              {t('matrix')}
            </TabsTrigger>
            <TabsTrigger
              value="actions"
              className="text-xs data-[state=active]:bg-accent data-[state=active]:text-white"
            >
              {t('actions')}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Scrollable content area - Full height without cards */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <TabsContent value="maps" className="h-full m-0 p-4">
            <MapsTab
              state={state}
              actions={actions}
              onActiveStationsTargetKeyChange={onActiveStationsTargetKeyChange}
              onClearExternalStationsMaps={onClearExternalStationsMaps}
            />
          </TabsContent>

          <TabsContent value="filter" className="h-full m-0 p-4">
            <FilterTab state={state} actions={actions} />
          </TabsContent>

          <TabsContent value="matrix" className="h-full m-0 p-4">
            <MatrixTab state={state} actions={actions} />
          </TabsContent>

          <TabsContent value="actions" className="h-full m-0 p-4">
            <ActionsTab
              state={state}
              actions={actions}
              apiBusy={apiBusy}
              apiError={apiError}
              onAnalyze={handleAnalyze}
              onCreateQuickGraph={handleCreateQuickGraph}
              deltaLoading={deltaLoading}
              deltaAutoSource={deltaAutoSource}
              quickGraphBusy={quickGraphBusy}
              quickGraphError={quickGraphError}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}