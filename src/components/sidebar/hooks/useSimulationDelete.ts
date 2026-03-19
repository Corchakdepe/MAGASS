// hooks/useSimulationDelete.ts

import { useState } from 'react';
import { API_BASE } from '@/lib/analysis/constants';
import type { DeleteState, UseSimulationDeleteReturn } from '../types/historySidebar';

export function useSimulationDelete(
  onRunIdChange?: (runId: string) => void,
  onDeleteSuccess?: () => Promise<void>
): UseSimulationDeleteReturn {
  const [deleteState, setDeleteState] = useState<DeleteState>({
    id: null,
    isDeleting: false,
    showConfirm: null
  });

  const setDeletingId = (id: string | null) => {
    setDeleteState(prev => ({ ...prev, id, isDeleting: !!id }));
  };

  const setShowDeleteConfirm = (id: string | null) => {
    setDeleteState(prev => ({ ...prev, showConfirm: id }));
  };

  const handleDeleteClick = (simfolder: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(simfolder);
  };

  const handleConfirmDelete = async (simfolder: string) => {
    setDeletingId(simfolder);

    try {
      const response = await fetch(`${API_BASE}/simulations/${encodeURIComponent(simfolder)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete simulation');
      }

      // Clear current run if it's the one being deleted
      if (onRunIdChange) {
        onRunIdChange("");
      }

      // Reload history
      if (onDeleteSuccess) {
        await onDeleteSuccess();
      }

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

  return {
    deleteState,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    setDeletingId,
    setShowDeleteConfirm
  };
}