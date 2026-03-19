"use client";

import * as React from "react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useLanguage} from "@/contexts/LanguageContext";
import {useGraphAnalysisState} from "../hooks/useGraphAnalysisState";
import {useGraphAnalysis} from "../hooks/useGraphAnalysis";
import {GraphsTab} from "./tabsGraphs/GraphsTab";
import {FilterTab} from "./tabsGraphs/FilterTab";
import {MatrixTab} from "./tabsGraphs/MatrixTab";
import {ActionsTab} from "./tabsGraphs/ActionsTab";
import type {GraphAnalysisPanelProps} from "../types/graphAnalysis";

export default function GraphAnalysisPanel({runId}: GraphAnalysisPanelProps) {
  const {t} = useLanguage();
  const [state, actions, uiHydrated] = useGraphAnalysisState();
  const {apiBusy, apiError, handleAnalyze} = useGraphAnalysis(runId, state);

  if (!uiHydrated) {
    return (
      <div className="h-full flex items-center justify-center text-text-secondary">
        {t('loading')}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface-0">
      <Tabs defaultValue="graphs" className="flex-1 flex flex-col min-h-0">
        {/* Header strip - Fixed at top with more compact design */}
        <div className="shrink-0 border-b border-surface-3 bg-surface-1/80 backdrop-blur-sm px-4 py-1.5">
          <TabsList className="w-full grid grid-cols-4 bg-surface-2/50">
            <TabsTrigger
              value="graphs"
              className="text-xs data-[state=active]:bg-accent data-[state=active]:text-white"
            >
              {t('graphs')}
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
          <TabsContent value="graphs" className="h-full m-0 p-4">
            <GraphsTab state={state} actions={actions} />
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
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}