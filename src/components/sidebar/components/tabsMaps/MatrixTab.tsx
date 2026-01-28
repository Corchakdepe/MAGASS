import * as React from "react";
import {CardContent} from "@/components/ui/card";
import {MatrixSelect} from "@/components/controls/MatrixControls/MatrixSelect";
import {useLanguage} from "@/contexts/LanguageContext";
import {MATRICES} from "@/lib/analysis/constants";
import type {MapsAnalysisState, MapsAnalysisActions} from "../../types/mapsAnalysis";

interface MatrixTabProps {
  state: MapsAnalysisState;
  actions: MapsAnalysisActions;
}

export function MatrixTab({state, actions}: MatrixTabProps) {
  const {t} = useLanguage();

  return (
    <CardContent className="space-y-4">
      <div>
        <div className="text-xs font-semibold text-text-primary">{t('matrix')}</div>
        <div className="text-[11px] text-text-secondary">
          {t('chooseAggregationMatrix')}
        </div>
      </div>

      <MatrixSelect
        matrices={MATRICES}
        seleccionAgreg={state.seleccionAgreg}
        setSeleccionAgreg={actions.setSeleccionAgreg}
      />
    </CardContent>
  );
}
