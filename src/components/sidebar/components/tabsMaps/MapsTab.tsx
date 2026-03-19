// src/components/sidebar/components/tabsMaps/MapsTab.tsx
import * as React from "react";
import {MapsControls} from "@/components/controls/MapsControls/MapsControls";
import {AdvancedControls} from "@/components/controls/AdvancedControls/AdvancedControls";
import {useLanguage} from "@/contexts/LanguageContext";
import {MAPAS} from "@/lib/analysis/constants";
import {computeDeltaOutMin} from "../../utils/quickGraphBuilder";
import {Map, Settings2, Layers} from "lucide-react";
import type {
    MapsAnalysisState,
    MapsAnalysisActions,
    MapsAnalysisPanelProps,
    MapKey
} from "../../types/mapsAnalysis";

interface MapsTabProps {
  state: MapsAnalysisState;
  actions: MapsAnalysisActions;
  externalStationsMaps?: Record<string, string>;     // ← ADD THIS LINE
  onActiveStationsTargetKeyChange?: MapsAnalysisPanelProps['onActiveStationsTargetKeyChange'];
  onClearExternalStationsMaps?: MapsAnalysisPanelProps['onClearExternalStationsMaps'];
}


// Default stations maps object for safety
const DEFAULT_STATIONS_MAPS: Record<MapKey, string> = {
    mapa_densidad: "",
    mapa_circulo: "",
    mapa_voronoi: "",
    mapa_desplazamientos: "",
};

export function MapsTab({
                            state,
                            actions,
                            externalStationsMaps,
                            onActiveStationsTargetKeyChange,
                            onClearExternalStationsMaps,
                        }: MapsTabProps) {
    const {t} = useLanguage();

    const deltaOutMin = React.useMemo(() => {
        return computeDeltaOutMin({
            deltaInMin: state.deltaInMin || 15,
            advancedUser: state.advancedUser || false,
            deltaMode: state.deltaMode || "media",
            deltaValueTxt: state.deltaValueTxt || "",
        });
    }, [state.deltaInMin, state.advancedUser, state.deltaMode, state.deltaValueTxt]);

    // Safely access stationsMaps with a default
    const stationsMaps = React.useMemo(() => {
        return state.stationsMaps || DEFAULT_STATIONS_MAPS;
    }, [state.stationsMaps]);

    // Safely access instantesMaps with a default
    const instantesMaps = React.useMemo(() => {
        return state.instantesMaps || {};
    }, [state.instantesMaps]);

    // Safely access selectedMaps with a default
    const selectedMaps = React.useMemo(() => {
        return state.selectedMaps || [];
    }, [state.selectedMaps]);

    // Debug effect - remove in production
    React.useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('MapsTab - stationsMaps:', stationsMaps);
        }
    }, [stationsMaps]);

    return (
        <div className="space-y-4">
            {/* Compact Header */}
            <div className="sticky top-0 z-10 backdrop-blur-sm -mx-1 px-1 py-2 border-b border-surface-3/70">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <div className="p-1 rounded-md bg-accent/10">
                            <Map className="h-3.5 w-3.5 text-accent shrink-0"/>
                        </div>
                        <h4 className="text-xs font-semibold text-text-primary truncate">
                            {t('maps')}
                        </h4>
                    </div>

                    {/* Delta badge */}
                    <div
                        className="flex items-center gap-1.5 px-2 py-1 bg-surface-2 rounded-md border border-surface-3 shrink-0">
                        <span className="text-[9px] font-medium text-text-tertiary">Δ</span>
                        <span className="text-xs font-semibold text-accent">{deltaOutMin}</span>
                        <span className="text-[8px] text-text-tertiary">{t('min')}</span>
                    </div>
                </div>
                <p className="text-[10px] text-text-secondary mt-1.5 leading-relaxed">
                    {t('selectMapsAndConfigureParameters')}
                </p>
            </div>

            {/* Main controls */}
            <div className="space-y-4 overflow-x-hidden">
                {/* Maps Controls Section */}
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5 px-1">
                        <Layers className="h-3 w-3 text-accent shrink-0"/>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
              {t('mapConfiguration')}
            </span>
                        <div className="flex-1 h-px bg-surface-3/50 ml-2"/>
                    </div>

                    {/* MapsControls with safe defaults */}
                    <MapsControls
                        MAPAS={MAPAS}
                        mapUserName={state.mapUserName || ""}
                        setMapUserName={actions.setMapUserName}
                        selectedMaps={selectedMaps}
                        setSelectedMaps={actions.setSelectedMaps}
                        stationsMaps={stationsMaps}
                        setStationsMaps={actions.setStationsMaps}
                        instantesMaps={instantesMaps}
                        setInstantesMaps={actions.setInstantesMaps}
                        deltaOutMin={deltaOutMin}
                        useFilterForMaps={state.useFilterForMaps || false}
                        externalStationsMaps={externalStationsMaps}
                        onActiveStationsTargetKeyChange={onActiveStationsTargetKeyChange}
                        onClearExternalStationsMaps={onClearExternalStationsMaps}
                    />
                </div>

                {/* Advanced Controls Section */}
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5 px-1">
                        <Settings2 className="h-3 w-3 text-warning shrink-0"/>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
              {t('advancedConfiguration')}
            </span>
                        <div className="flex-1 h-px bg-surface-3/50 ml-2"/>
                        {state.advancedUser && (
                            <span
                                className="text-[8px] font-medium bg-warning/10 text-warning px-1.5 py-0.5 rounded-full border border-warning/20 whitespace-nowrap">
                {t('active')}
              </span>
                        )}
                    </div>

                    <AdvancedControls
                        advancedUser={state.advancedUser || false}
                        setAdvancedUser={actions.setAdvancedUser}
                        deltaMode={state.deltaMode || "media"}
                        setDeltaMode={actions.setDeltaMode}
                        deltaValueTxt={state.deltaValueTxt || ""}
                        setDeltaValueTxt={actions.setDeltaValueTxt}
                        advancedEntrada={state.advancedEntrada || ""}
                        setAdvancedEntrada={actions.setAdvancedEntrada}
                        advancedSalida={state.advancedSalida || ""}
                        setAdvancedSalida={actions.setAdvancedSalida}
                    />
                </div>
            </div>
        </div>
    );
}