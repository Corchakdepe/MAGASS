"use client";

import * as React from "react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Card, CardHeader, CardTitle} from "@/components/ui/card";
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
    return <div className="p-4">{t('loading')}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="graphs" className="flex-1 flex flex-col min-h-0">
        {/* Header strip - Fixed at top */}
        <div className="shrink-0 border-b border-surface-3 bg-surface-1/50 px-4 py-2">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="graphs">{t('graphs')}</TabsTrigger>
            <TabsTrigger value="filter">{t('filter')}</TabsTrigger>
            <TabsTrigger value="matrix">{t('matrix')}</TabsTrigger>
            <TabsTrigger value="actions">{t('actions')}</TabsTrigger>
          </TabsList>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4">
            <TabsContent value="graphs" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>{t('graphs')}</CardTitle>
                </CardHeader>
                <GraphsTab state={state} actions={actions} />
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
                />
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
