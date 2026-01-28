import {BottomPanel} from "@/components/layout/components/BottomPanel";
import MapsAnalysisPanel from "@/components/sidebar/components/MapsAnalysisPanel";
import GraphAnalysisPanel from "@/components/sidebar/components/GraphAnalysisPanel";
import type {SimulationData} from "@/types/simulation";
import type {PanelMode} from "@/components/layout/types/layout";

type BottomPanelContainerProps = {
  panelMode: PanelMode;
  currentRunId: string | null;
  externalStationsMaps: Record<string, string>;
  onHeightChange: (height: number) => void;
  onSimulationComplete: (data: SimulationData) => void;
  onClearExternalStationsMaps: () => void;
};

export default function BottomPanelContainer({
  panelMode,
  currentRunId,
  externalStationsMaps,
  onHeightChange,
  onSimulationComplete,
  onClearExternalStationsMaps,
}: BottomPanelContainerProps) {

  return (
    <BottomPanel
      defaultOpen
      leftOffsetPx={256}
      onHeightChange={onHeightChange}
    >
      {panelMode === "maps" && (
        <MapsAnalysisPanel
          runId={currentRunId ?? undefined}
          externalStationsMaps={externalStationsMaps}
          onClearExternalStationsMaps={onClearExternalStationsMaps}
        />
      )}
      {panelMode === "graphs" && (
        <GraphAnalysisPanel runId={currentRunId ?? undefined} />
      )}
    </BottomPanel>
  );
}
