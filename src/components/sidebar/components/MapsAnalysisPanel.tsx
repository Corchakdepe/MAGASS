"use client";

import * as React from "react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Card, CardHeader, CardTitle} from "@/components/ui/card";
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
    return <div className="p-4">{t('loading')}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="maps" className="flex-1 flex flex-col min-h-0">
        {/* Header strip - Fixed at top */}
        <div className="shrink-0 border-b border-surface-3 bg-surface-1/50 px-4 py-2">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="maps">{t('maps')}</TabsTrigger>
            <TabsTrigger value="filter">{t('filter')}</TabsTrigger>
            <TabsTrigger value="matrix">{t('matrix')}</TabsTrigger>
            <TabsTrigger value="actions">{t('actions')}</TabsTrigger>
          </TabsList>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4">
            <TabsContent value="maps" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>{t('maps')}</CardTitle>
                </CardHeader>
                <MapsTab
                  state={state}
                  actions={actions}
                  onActiveStationsTargetKeyChange={onActiveStationsTargetKeyChange}
                  onClearExternalStationsMaps={onClearExternalStationsMaps}
                />
              </Card>
            </TabsContent>

            <TabsContent value="filter" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>{t('filter')}</CardTitle>
                </CardHeader>
                <FilterTab state={state} actions={actions} />
              </Card>
            </TabsContent>

            <TabsContent value="matrix" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>{t('matrix')}</CardTitle>
                </CardHeader>
                <MatrixTab state={state} actions={actions} />
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>{t('actions')}</CardTitle>
                </CardHeader>
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
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
