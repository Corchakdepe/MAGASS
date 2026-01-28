import {SelectField} from '@/components/form/components/SelectField';
import {useSimulationFormConfig} from '../hooks/useSimulationFormConfig';

type StressTypeSectionProps = {
  stressType: string;
  setStressType: (v: string) => void;
  t: (key: string) => string;
};

export function StressTypeSection({
  stressType,
  setStressType,
  t,
}: StressTypeSectionProps) {
  const {stressOptions} = useSimulationFormConfig(t);

  return (
    <SelectField
      id="stressType"
      label={t('stressType')}
      value={stressType}
      onChange={setStressType}
      options={stressOptions}
      placeholder={t('selectStressType')}
    />
  );
}
