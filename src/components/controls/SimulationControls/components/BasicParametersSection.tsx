import {TextInputField} from './TextInputField';

type BasicParametersSectionProps = {
  simName: string;
  setSimName: (v: string) => void;
  t: (key: string) => string;
};

export function BasicParametersSection({
  simName,
  setSimName,
  t,
}: BasicParametersSectionProps) {
  return (
    <TextInputField
      id="simName"
      label={t('simulationName')}
      value={simName}
      onChange={setSimName}
      placeholder={t('simulationNamePlaceholder')}
    />
  );
}
