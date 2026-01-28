import {SliderField} from './SliderField';
import {NumberInputField} from './NumberInputField';

type PerformanceParametersSectionProps = {
  stress: number;
  setStress: (v: number) => void;
  walkCost: number;
  setWalkCost: (v: number) => void;
  delta: number;
  setDelta: (v: number) => void;
  t: (key: string) => string;
};

export function PerformanceParametersSection({
  stress,
  setStress,
  walkCost,
  setWalkCost,
  delta,
  setDelta,
  t,
}: PerformanceParametersSectionProps) {
  return (
    <>
      <SliderField
        id="stress"
        label={t('stressLevel')}
        value={stress}
        onChange={setStress}
        min={0}
        max={100}
        unit="%"
      />

      <SliderField
        id="walkCost"
        label={t('walkCost')}
        value={walkCost}
        onChange={setWalkCost}
        min={0}
        max={100}
        unit="%"
      />

      <NumberInputField
        id="delta"
        label={t('deltaMinutes')}
        value={delta}
        onChange={setDelta}
        min={1}
        max={1440}
        step={1}
      />
    </>
  );
}
