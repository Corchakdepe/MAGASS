'use client';

import React, { useState } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
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
        <MainContentAnalytics
          simulationData={simulationData}
          triggerRefresh={refreshTrigger}
        />

      </SidebarInset>




    </SidebarProvider>
  );
}
