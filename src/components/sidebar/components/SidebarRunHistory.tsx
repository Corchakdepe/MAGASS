'use client';

import {usePathname} from 'next/navigation';
import {SidebarHeader, SidebarContent as SidebarBody} from '@/components/ui/sidebar';
import {Button} from '@/components/ui/button';
import {useLanguage} from '@/contexts/LanguageContext';
import LanguageSelector from "@/components/controls/CommunControls/LanguageSelector";
import SimulationPanel from './SimulationPanel';
import {useSidebarHistory} from '../hooks/useSidebarHistory';
import type {SidebarRunHistoryProps} from '../types/sidebar';

export default function SidebarRunHistory({
  onSimulationComplete,
  currentRunId,
  onRunIdChange,
}: SidebarRunHistoryProps) {
  const {t} = useLanguage();
  const pathname = usePathname();
  const {history, loadingHistory, loadHistory, handleSelectRun} = useSidebarHistory(
    onSimulationComplete,
    onRunIdChange
  );

  let content: React.ReactNode = null;

  if (pathname === '/simulador') {
    content = <SimulationPanel onSimulationComplete={onSimulationComplete!} />;
  } else {
    content = (
      <>
        <SidebarHeader className="border-b border-surface-3/50 px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">{t('simulationHistory')}</h3>
            <p className="text-xs text-text-secondary">{t('selectRunToLoadSummary')}</p>
          </div>
          <LanguageSelector />
        </SidebarHeader>

        <SidebarBody className="px-4 py-4">
          {loadingHistory && (
            <p className="text-sm text-text-secondary">{t('loadingHistory')}</p>
          )}
          {!loadingHistory && history.length === 0 && (
            <p className="text-sm text-text-secondary">{t('noSimulationsYet')}</p>
          )}
          {!loadingHistory && history.length > 0 && (
            <div className="space-y-2">
              {history.map((item) => (
                <Button
                  key={item.simfolder}
                  variant={currentRunId === item.simfolder ? 'default' : 'outline'}
                  className="w-full justify-start text-left"
                  onClick={() => handleSelectRun(item)}
                >
                  <div className="truncate">
                    <div className="font-medium">{item.name || item.simfolder}</div>
                    <div className="text-xs opacity-70">{item.created}</div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </SidebarBody>
      </>
    );
  }

  return content;
}
