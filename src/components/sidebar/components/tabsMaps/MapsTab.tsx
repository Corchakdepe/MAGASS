import * as React from "react";
import {CardContent} from "@/components/ui/card";
import {MapsControls} from "@/components/controls/MapsControls/MapsControls";
import {AdvancedControls} from "@/components/controls/AdvancedControls/AdvancedControls";
import {useLanguage} from "@/contexts/LanguageContext";
import {MAPAS} from "@/lib/analysis/constants";
import {computeDeltaOutMin} from "../../utils/quickGraphBuilder";
import type {MapsAnalysisState, MapsAnalysisActions, MapsAnalysisPanelProps} from "../../types/mapsAnalysis";

interface MapsTabProps {
  state: MapsAnalysisState;
  actions: MapsAnalysisActions;
  onActiveStationsTargetKeyChange?: MapsAnalysisPanelProps['onActiveStationsTargetKeyChange'];
  onClearExternalStationsMaps?: MapsAnalysisPanelProps['onClearExternalStationsMaps'];
}

export function MapsTab({
  state,
  actions,
  onActiveStationsTargetKeyChange,
  onClearExternalStationsMaps,
}: MapsTabProps) {
  const {t} = useLanguage();

  const deltaOutMin = computeDeltaOutMin({
    deltaInMin: state.deltaInMin,
    advancedUser: state.advancedUser,
    deltaMode: state.deltaMode,
    deltaValueTxt: state.deltaValueTxt,
  });

  return (
    <CardContent className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-text-primary">{t('maps')}</div>
          <div className="text-[11px] text-text-secondary">
            {t('selectMapsAndConfigureParameters')}
          </div>
        </div>

        <div className="text-[11px] text-text-tertiary">
          Δ out: <span className="text-text-primary font-semibold">{deltaOutMin}</span> {t('min')}
        </div>
      </div>

      <MapsControls
        MAPAS={MAPAS}
        mapUserName={state.mapUserName}
        setMapUserName={actions.setMapUserName}
        selectedMaps={state.selectedMaps}
        setSelectedMaps={actions.setSelectedMaps}
        stationsMaps={state.stationsMaps}
        setStationsMaps={actions.setStationsMaps}
        instantesMaps={state.instantesMaps}
        setInstantesMaps={actions.setInstantesMaps}
        deltaOutMin={deltaOutMin}
        useFilterForMaps={state.useFilterForMaps}
        onActiveStationsTargetKeyChange={onActiveStationsTargetKeyChange}
        onClearExternalStationsMaps={onClearExternalStationsMaps}
      />

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
    </CardContent>
  );
}
