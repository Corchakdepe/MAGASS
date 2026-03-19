// hooks/useFilterCreation.ts
import { useState, useCallback } from 'react';
import {
  UnifiedFilterState,
  FilterKind,
  FilterResponse
} from '@/components/controls/FilterControls/types/filterControls';
import { buildFilterPayload, FilterPayload } from '@/components/controls/FilterControls/utils/filterHelpers';
import type { DateRange } from 'react-day-picker';
import {filterService} from "@/components/controls/FilterControls/services/filterService";

interface UseFilterCreationProps {
  runId: string;
  filterKind: FilterKind;
  filterState: UnifiedFilterState;
  daysRange: DateRange | undefined;
  onSuccess?: (response: FilterResponse) => void;
  onError?: (error: string) => void;
}

export function useFilterCreation({
  runId,
  filterKind,
  filterState,
  daysRange,
  onSuccess,
  onError
}: UseFilterCreationProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<FilterResponse | null>(null);

  const createFilter = useCallback(async () => {
    if (!runId) {
      const errorMsg = 'No run ID provided';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const payload = buildFilterPayload(filterKind, filterState, daysRange, runId);

      let response: FilterResponse;

      switch (filterKind) {
        case 'EstValor':
          response = await filterService.filterEstacionesDia(payload as any);
          break;
        case 'EstValorDias':
          response = await filterService.filterEstacionesMes(payload as any);
          break;
        case 'Horas':
          response = await filterService.filterHoras(payload as any);
          break;
        case 'Porcentaje':
          response = await filterService.filterPorcentajeTiempo(payload as any);
          break;
        default:
          throw new Error(`Unknown filter kind: ${filterKind}`);
      }

      setLastResponse(response);

      if (response.success) {
        onSuccess?.(response);
      } else {
        const errorMsg = response.message || 'Filter creation failed';
        setError(errorMsg);
        onError?.(errorMsg);
      }

      return response;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to create filter';
      setError(errorMsg);
      onError?.(errorMsg);
      console.error('Filter creation error:', err);
    } finally {
      setIsCreating(false);
    }
  }, [runId, filterKind, filterState, daysRange, onSuccess, onError]);

  const reset = useCallback(() => {
    setIsCreating(false);
    setError(null);
    setLastResponse(null);
  }, []);

  return {
    createFilter,
    isCreating,
    error,
    lastResponse,
    reset
  };
}