'use client';

import { useState } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import SidebarContentComponent from '@/components/sidebar-content';
import SidebarContentStatistics from '@/components/statistics-sidebar-content';
import MainContentMaps from '@/components/main-contentMaps';
import type { SimulationData } from '@/types/simulation';
import StatisticsSimulationForm from '@/components/statistics-form';


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
        <MainContentMaps
          simulationData={simulationData}
          triggerRefresh={refreshTrigger}
        />
      </SidebarInset>
      <Sidebar side="right">
         <StatisticsSimulationForm></StatisticsSimulationForm>
      </Sidebar>
    </SidebarProvider>
  );
}
