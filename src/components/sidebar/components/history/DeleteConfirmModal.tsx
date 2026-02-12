                                  // components/DeleteConfirmModal.tsx

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeleteConfirmModalProps {
  show: boolean;
  deletingId: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  show,
  deletingId,
  onConfirm,
  onCancel
}: DeleteConfirmModalProps) {
  const { t } = useLanguage();

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-1 rounded-lg border border-surface-3 p-6 max-w-sm w-full shadow-lg">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{t('deleteSimulation') || 'Delete Simulation'}</h3>
            <p className="text-sm text-text-secondary mt-1">
              {t('deleteSimulationConfirm') || 'Are you sure you want to delete this simulation? This action cannot be undone.'}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={!!deletingId}
          >
            {t('cancel') || 'Cancel'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={!!deletingId}
          >
            {deletingId ? (t('deleting') || 'Deleting...') : (t('delete') || 'Delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}