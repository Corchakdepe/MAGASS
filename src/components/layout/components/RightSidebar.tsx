import { SidebarProvider, Sidebar } from "@/components/ui/sidebar";
import SidebarRunHistory from "@/components/sidebar/components/history/SidebarRunHistory";
import MapsAnalysisPanel from "@/components/sidebar/components/MapsAnalysisPanel";
import GraphAnalysisPanel from "@/components/sidebar/components/GraphAnalysisPanel";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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
  // Width control
  width?: number; // Width in pixels
  collapsedWidth?: number; // Width when collapsed in pixels
  defaultCollapsed?: boolean; // Initial collapsed state
  onCollapsedChange?: (collapsed: boolean) => void; // Callback when collapse state changes
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
  // Width control
  width = 480,
  collapsedWidth = 48,
  defaultCollapsed = false,
  onCollapsedChange,
}: RightSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Determine which content to show
  const showContent = showBottomPanel || showRunHistory;
  const currentWidth = isCollapsed ? collapsedWidth : width;

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

  if (!showContent) {
    return null;
  }

  return (
    <div className="shrink-0 h-screen">
      <SidebarProvider
        defaultOpen
        className="h-full"
        style={{
          '--sidebar-width': `${currentWidth}px`,
          '--sidebar-width-mobile': `${currentWidth}px`
        } as React.CSSProperties}
      >
        <Sidebar
          side="right"
          className="bg-surface-1/85 backdrop-blur-md border-l border-surface-3 shadow-sm w-[--sidebar-width] transition-all duration-300 ease-in-out"
        >
          {/* Collapse Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute -left-3 top-4 z-50 h-6 w-6 rounded-full border border-surface-3 bg-surface-1 shadow-sm hover:bg-surface-2"
            onClick={handleToggleCollapse}
          >
            {isCollapsed ? (
              <ChevronLeft className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>

          {/* Content - conditionally render based on collapsed state */}
          {!isCollapsed && (
            <div className="h-full overflow-y-auto">
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
            </div>
          )}

          {/* Optional: Show minimal content when collapsed */}
          {isCollapsed && (
            <div className="h-full flex flex-col items-center pt-12">
              {/* You can add icons or indicators here */}
              {showRunHistory && (
                <div className="text-xs text-muted-foreground rotate-90 whitespace-nowrap mt-4">
                  History
                </div>
              )}
              {showBottomPanel && panelMode === "maps" && (
                <div className="text-xs text-muted-foreground rotate-90 whitespace-nowrap mt-4">
                  Maps
                </div>
              )}
              {showBottomPanel && panelMode === "graphs" && (
                <div className="text-xs text-muted-foreground rotate-90 whitespace-nowrap mt-4">
                  Graphs
                </div>
              )}
            </div>
          )}
        </Sidebar>
      </SidebarProvider>
    </div>
  );
}