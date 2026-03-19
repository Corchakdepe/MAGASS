import {Button} from '@/components/ui/button';
import {Play, Loader2} from 'lucide-react';

type FormActionsSectionProps = {
  onSubmit: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  t: (key: string) => string;
};

export function FormActionsSection({
  onSubmit,
  isLoading = false,
  disabled = false,
  t,
}: FormActionsSectionProps) {
  return (
    <div className="pt-2">
      <Button
        onClick={onSubmit}
        disabled={disabled || isLoading}
        className="w-full h-9 text-xs font-medium bg-accent hover:bg-accent/90 text-white"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('runningSimulation') || 'Running...'}
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            {t('runSimulation') || 'Run Simulation'}
          </>
        )}
      </Button>
    </div>
  );
}
