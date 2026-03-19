import {useMemo} from 'react';

type FormConfig = {
  stressOptions: Array<{value: string; label: string}>;
  defaultValues: {
    stress: number;
    walkCost: number;
    delta: number;
    stressType: string;
  };
  validation: {
    stress: {min: number; max: number};
    walkCost: {min: number; max: number};
    delta: {min: number; max: number};
  };
};

export function useSimulationFormConfig(t: (key: string) => string): FormConfig {
  return useMemo(
    () => ({
      stressOptions: [
        {value: '0', label: t('stressTypeNone')},
        {value: '1', label: t('stressTypeBike')},
        {value: '2', label: t('stressTypeMovement')},
        {value: '3', label: t('stressTypeBoth')},
      ],
      defaultValues: {
        stress: 50,
        walkCost: 50,
        delta: 60,
        stressType: '0',
      },
      validation: {
        stress: {min: 0, max: 100},
        walkCost: {min: 0, max: 100},
        delta: {min: 1, max: 1440},
      },
    }),
    [t]
  );
}
