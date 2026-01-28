import {SidebarProvider, Sidebar} from "@/components/ui/sidebar";
import SidebarRunHistory from "@/components/sidebar/components/SidebarRunHistory";
import type {SimulationData} from "@/types/simulation";

type RightSidebarProps = {
  currentRunId: string | null;
  onRunIdChange: (id: string | null) => void;
  onSimulationComplete: (data: SimulationData) => void;
};

export default function RightSidebar({
  currentRunId,
  onRunIdChange,
  onSimulationComplete,
}: RightSidebarProps) {
  return (
    <div className="shrink-0 h-screen">
      <SidebarProvider defaultOpen className="h-full">
        <Sidebar
          side="right"
          className="bg-surface-1/85 backdrop-blur-md border-l border-surface-3 shadow-sm"
        >
          <SidebarRunHistory
            onSimulationComplete={onSimulationComplete}
            currentRunId={currentRunId}
            onRunIdChange={onRunIdChange}
          />
        </Sidebar>
      </SidebarProvider>
    </div>
  );
}
