import * as React from "react";
import {MapsControls} from "@/components/controls/MapsControls/MapsControls";
import {AdvancedControls} from "@/components/controls/AdvancedControls/AdvancedControls";
import {useLanguage} from "@/contexts/LanguageContext";
import {MAPAS} from "@/lib/analysis/constants";
import {computeDeltaOutMin} from "../../utils/quickGraphBuilder";
import {Map, Settings2, Filter, ChevronRight} from "lucide-react";
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
    <div className="space-y-4">
      {/* Compact Header - No metallic effects */}
      <div className="sticky top-0 z-10 backdrop-blur-sm -mx-1 px-1 py-2 border-b border-surface-3/70">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="p-1 rounded-md bg-accent/10">
              <Map className="h-3.5 w-3.5 text-accent shrink-0" />
            </div>
            <h4 className="text-xs font-semibold text-text-primary truncate">
              {t('maps')}
            </h4>
          </div>

          {/* Delta badge - Simple and clean */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-2 rounded-md border border-surface-3 shrink-0">
            <span className="text-[9px] font-medium text-text-tertiary">Δ</span>
            <span className="text-xs font-semibold text-accent">{deltaOutMin}</span>
            <span className="text-[8px] text-text-tertiary">{t('min')}</span>
          </div>
        </div>
        <p className="text-[10px] text-text-secondary mt-1.5 leading-relaxed">
          {t('selectMapsAndConfigureParameters')}
        </p>
      </div>

      {/* Main controls - Stacked vertically, no horizontal overflow */}
      <div className="space-y-4 overflow-x-hidden">
        {/* Maps Controls Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <Layers className="h-3 w-3 text-accent shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
              {t('mapConfiguration')}
            </span>
            <div className="flex-1 h-px bg-surface-3/50 ml-2" />
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
        </div>

        {/* Advanced Controls Section */}
          <div className="flex items-center gap-1.5 px-1">
            <Settings2 className="h-3 w-3 text-warning shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
              {t('advancedConfiguration')}
            </span>
            <div className="flex-1 h-px bg-surface-3/50 ml-2" />
          </div>
        {state.advancedUser && (
              <span className="text-[8px] font-medium bg-warning/10 text-warning px-1.5 py-0.5 rounded-full border border-warning/20 whitespace-nowrap">
                {t('active')}
              </span>
            )}

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
        </div>
    </div>
  );
}

// Helper component for Layers icon since it wasn't imported
function Layers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}