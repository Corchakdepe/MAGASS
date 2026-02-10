'use client';

import {usePathname} from 'next/navigation';
import {SidebarHeader, SidebarContent as SidebarBody} from '@/components/ui/sidebar';
import {Button} from '@/components/ui/button';
import {useLanguage} from '@/contexts/LanguageContext';
import LanguageSelector from "@/components/controls/CommunControls/LanguageSelector";
import SimulationPanel from './SimulationPanel';
import {useSidebarHistory} from '../hooks/useSidebarHistory';
import type {SidebarRunHistoryProps} from '../types/sidebar';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

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

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (simfolder: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the run when clicking delete
    setShowDeleteConfirm(simfolder);
  };

  const handleConfirmDelete = async (simfolder: string) => {
    setDeletingId(simfolder);
    try {
      // Call backend API to delete the simulation folder
      const response = await fetch(`/api/simulations/${encodeURIComponent(simfolder)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete simulation');
      }

      // If we're deleting the currently selected run, clear the selection
      if (currentRunId === simfolder && onRunIdChange) {
        onRunIdChange(null);
      }

      // Reload the history list
      loadHistory();

    } catch (error) {
      console.error('Error deleting simulation:', error);
      alert('Failed to delete simulation. Please try again.');
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };

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
  <div key={item.simfolder} className="flex items-center gap-2 group">
    {/* Main selection button - takes most of the width */}
  <Button
  variant={currentRunId === item.simfolder ? 'default' : 'outline'}
  className="flex-1 justify-start text-left hover:bg-surface-2 transition-colors overflow-hidden"
  onClick={() => handleSelectRun(item)}
  disabled={deletingId === item.simfolder}
>
  <div className="truncate w-full">
    <div className="font-medium truncate">{item.name || item.simfolder}</div>
    <div className="text-xs opacity-50 truncate">{item.created}</div>
  </div>
</Button>

    {/* Delete button - separate, on the right */}
    <button
      onClick={(e) => handleDeleteClick(item.simfolder, e)}
      className="p-2 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all flex-shrink-0"
      title="Delete simulation"
      disabled={deletingId === item.simfolder}
    >
      {deletingId === item.simfolder ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  </div>
))}
            </div>
          )}
        </SidebarBody>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-1 rounded-lg border border-surface-3 p-6 max-w-sm w-full shadow-lg">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-full bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Delete Simulation</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Are you sure you want to delete this simulation? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelDelete}
                  disabled={deletingId === showDeleteConfirm}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleConfirmDelete(showDeleteConfirm)}
                  disabled={deletingId === showDeleteConfirm}
                >
                  {deletingId === showDeleteConfirm ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return content;
}