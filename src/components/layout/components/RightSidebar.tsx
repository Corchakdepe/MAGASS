import { SidebarProvider, Sidebar } from "@/components/ui/sidebar";
import SidebarRunHistory from "@/components/sidebar/components/SidebarRunHistory";
import MapsAnalysisPanel from "@/components/sidebar/components/MapsAnalysisPanel";
import GraphAnalysisPanel from "@/components/sidebar/components/GraphAnalysisPanel";
import type { SimulationData } from "@/types/simulation";
import type { PanelMode } from "@/components/layout/types/layout";

type RightSidebarProps = {
  currentRunId: string | null;
  onRunIdChange: (id: string | null) => void;
  onSimulationComplete: (data: SimulationData) => void;
  // Bottom panel specific props
  panelMode?: PanelMode;
  externalStationsMaps?: Record<string, string>;
  onHeightChange?: (height: number) => void;
  onClearExternalStationsMaps?: () => void;
  // Which content to show
  showBottomPanel?: boolean;
  showRunHistory?: boolean;
};

export default function RightSidebar({
  currentRunId,
  onRunIdChange,
  onSimulationComplete,
  // Bottom panel specific props
  panelMode = "maps",
  externalStationsMaps = {},
  onHeightChange,
  onClearExternalStationsMaps,
  // Content selection
  showBottomPanel = false,
  showRunHistory = false,
}: RightSidebarProps) {
  // Determine which content to show
  const showContent = showBottomPanel || showRunHistory;

  if (!showContent) {
    return null;
  }

  return (
    <div className="shrink-0 h-screen">
      <SidebarProvider defaultOpen className="h-full">
        <Sidebar
          side="right"
          className="bg-surface-1/85 backdrop-blur-md border-l border-surface-3 shadow-sm"
        >
          {showBottomPanel && panelMode === "maps" && (
            <MapsAnalysisPanel
              runId={currentRunId ?? undefined}
              externalStationsMaps={externalStationsMaps}
              onClearExternalStationsMaps={onClearExternalStationsMaps}
            />
          )}

          {showBottomPanel && panelMode === "graphs" && (
            <GraphAnalysisPanel runId={currentRunId ?? undefined} />
          )}

          {showRunHistory && (
            <SidebarRunHistory
              onSimulationComplete={onSimulationComplete}
              currentRunId={currentRunId}
              onRunIdChange={onRunIdChange}
            />
          )}
        </Sidebar>
      </SidebarProvider>
    </div>
  );
}