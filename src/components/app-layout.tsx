// components/app-layout.tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import SidebarContentComponent from '@/components/sidebar-content';
import SidebarHistory from '@/components/sidebar-history';
import MainContent from '@/components/main-content';
import type { SimulationData } from '@/types/simulation';
import type { MainContentMode } from '@/types/view-mode';

type AppLayoutProps = {
  children?: React.ReactNode;
};

function getModeFromPath(pathname: string): MainContentMode {
  if (pathname.startsWith('/simulador')) return 'simulations';
  if (pathname.startsWith('/analyticsGraphCreator')) return 'analyticsGraphs';
  if (pathname.startsWith('/analyticsMapCreator')) return 'analyticsMaps';
  if (pathname.startsWith('/maps')) return 'maps';
  return 'dashboard';
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const mode = getModeFromPath(pathname);

  const [simulationData, setSimulationData] = useState<SimulationData | null>(
    null
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSimulationComplete = (data: SimulationData) => {
    setSimulationData(data);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar izquierdo + contenido central */}
      <SidebarProvider defaultOpen>
        <Sidebar side="left">
          <SidebarContentComponent />
        </Sidebar>

        <SidebarInset>
          <div className="flex h-full w-full">
            <div className="flex-1 flex flex-col">
              <MainContent
                simulationData={simulationData}
                triggerRefresh={refreshTrigger}
                mode={mode}
              />
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Sidebar derecho independiente */}
      <SidebarProvider defaultOpen className="w-fit">
        <Sidebar side="right">
          <SidebarHistory onSimulationComplete={handleSimulationComplete} />
        </Sidebar>
      </SidebarProvider>
    </div>
  );
}
