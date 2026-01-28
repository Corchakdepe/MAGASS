import * as React from "react";
import {CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {AdvancedControls} from "@/components/controls/AdvancedControls/AdvancedControls";
import {useLanguage} from "@/contexts/LanguageContext";
import type {GraphAnalysisState, GraphAnalysisActions} from "../../types/graphAnalysis";

interface ActionsTabProps {
  state: GraphAnalysisState;
  actions: GraphAnalysisActions;
  apiBusy: boolean;
  apiError: string | null;
  onAnalyze: () => void;
}

export function ActionsTab({state, actions, apiBusy, apiError, onAnalyze}: ActionsTabProps) {
  const {t} = useLanguage();

  return (
    <CardContent className="space-y-4">
      <AdvancedControls
        advancedUser={state.advancedUser}
        setAdvancedUser={actions.setAdvancedUser as React.Dispatch<React.SetStateAction<boolean>>}
        deltaMode={state.deltaMode}
        setDeltaMode={actions.setDeltaMode as React.Dispatch<React.SetStateAction<"media" | "acumulada">>}
        deltaValueTxt={state.deltaValueTxt}
        setDeltaValueTxt={actions.setDeltaValueTxt as React.Dispatch<React.SetStateAction<string>>}
        advancedEntrada={state.advancedEntrada}
        setAdvancedEntrada={actions.setAdvancedEntrada as React.Dispatch<React.SetStateAction<string>>}
        advancedSalida={state.advancedSalida}
        setAdvancedSalida={actions.setAdvancedSalida as React.Dispatch<React.SetStateAction<string>>}
      />

      <Button
        onClick={onAnalyze}
        disabled={apiBusy || state.selectedCharts.length === 0}
        className="w-full"
      >
        {apiBusy ? t('analyzing') : t('analyzeGraphs')}
      </Button>

      {apiError && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {apiError}
        </div>
      )}
    </CardContent>
  );
}
