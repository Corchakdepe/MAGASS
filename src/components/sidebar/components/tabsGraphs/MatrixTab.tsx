import * as React from "react";
import {CardContent} from "@/components/ui/card";
import {MatrixSelect} from "@/components/controls/MatrixControls/MatrixSelect";
import {MATRICES} from "@/lib/analysis/constants";
import type {GraphAnalysisState, GraphAnalysisActions} from "../../types/graphAnalysis";

interface MatrixTabProps {
  state: GraphAnalysisState;
  actions: GraphAnalysisActions;
}

export function MatrixTab({state, actions}: MatrixTabProps) {
  return (
    <CardContent className="space-y-4">
      <MatrixSelect
        matrices={MATRICES}
        seleccionAgreg={state.seleccionAgreg}
        setSeleccionAgreg={actions.setSeleccionAgreg}
      />
    </CardContent>
  );
}
