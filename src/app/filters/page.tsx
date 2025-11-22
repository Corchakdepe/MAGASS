'use client';

import { useState } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import SidebarContentComponent from '@/components/sidebar-content';
import SidebarContentUpload from '@/components/upload-sidebar-content';
import MainContent from '@/components/main-content';
import type { SimulationData } from '@/types/simulation';

export default function AppLayout() {
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedPage, setSelectedPage] = useState('dashboard');

  const handleSimulationComplete = (data: SimulationData) => {
    setSimulationData(data);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <SidebarProvider>
      <Sidebar side="left">
        <SidebarContentComponent
          selectedPage={selectedPage}
          onSelectPage={setSelectedPage}
        />
      </Sidebar>

      <SidebarInset>
          <h1>Hello Filters</h1>
      </SidebarInset>

        <Sidebar side="right">
        <SidebarContentUpload
          onSimulationComplete={handleSimulationComplete}
        />
      </Sidebar>
    </SidebarProvider>
  );
}
