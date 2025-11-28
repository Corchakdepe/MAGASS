'use client';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent as SidebarBody,
  SidebarFooter,
} from '@/components/ui/sidebar';
import SidebarContentUploadSim from '@/components/sidebar-content-upload-sim';
import SidebarContentUploadMaps from '@/components/sidebar-content-upload-maps';
import GraphAnalysisSidebar from '@/components/graph-analysis-sidebar';

type SidebarHistoryProps = {
  onSimulationComplete?: (data: any) => void;
};

export default function SidebarHistory({ onSimulationComplete }: SidebarHistoryProps) {
  const pathname = usePathname();

  let content: React.ReactNode = (
    <p className="text-xs text-muted-foreground">
      Select a section on the left to configure simulations or analytics.
    </p>
  );

  if (pathname.startsWith('/simulador') && onSimulationComplete) {
    content = (
      <SidebarContentUploadSim onSimulationComplete={onSimulationComplete} />
    );
  } else if (pathname.startsWith('/analyticsMapCreator') && onSimulationComplete) {
    content = (
      <SidebarContentUploadMaps onSimulationComplete={onSimulationComplete} />
    );
  } else if (pathname.startsWith('/analyticsGraphCreator')) {
    content = <GraphAnalysisSidebar />;
  }

  return (
    <>
      <SidebarHeader className="p-4">
        <h2 className="text-xl font-semibold font-headline">Tools</h2>
      </SidebarHeader>
      <SidebarBody className="p-4 space-y-4 overflow-y-auto">
        {content}
      </SidebarBody>
      <SidebarFooter className="p-4 border-t">
        <p className="text-[10px] text-muted-foreground">Right sidebar</p>
      </SidebarFooter>
    </>
  );
}
