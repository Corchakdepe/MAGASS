import {Sidebar} from "@/components/ui/sidebar";
import SidebarNavigation from "@/components/sidebar/components/SidebarNavigation";

type LeftSidebarProps = {
  simulationName: string | null;
  currentRunId: string | null;
};

export default function LeftSidebar({simulationName, currentRunId}: LeftSidebarProps) {
  return (
    <Sidebar
      side="left"
      className="bg-surface-1/85 backdrop-blur-md border-r border-surface-3 shadow-sm"
    >
      <div className="h-full flex flex-col">
        <SidebarNavigation
          simulationName={simulationName}
          currentFolder={currentRunId}
        />
      </div>
    </Sidebar>
  );
}
