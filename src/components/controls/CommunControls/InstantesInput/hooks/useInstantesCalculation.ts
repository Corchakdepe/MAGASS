import type {Dayjs} from "dayjs";
import {computeInstanteFromDayTime, dateDiffInDays, snapMinutesToDelta} from "../utils/timeCalculations";
import type {Step, ClockView} from "../types/instantes";
import type {DateRange} from "react-day-picker";

interface UseInstantesCalculationParams {
  deltaOutMin: number;
  range: DateRange | undefined;
  step: Step;
  clockView: ClockView;
  fromTime: Dayjs;
  setFromTime: (time: Dayjs) => void;
  setToTime: (time: Dayjs) => void;
  setStep: (step: Step) => void;
  setClockView: (view: ClockView) => void;
  setOpen: (open: boolean) => void;
  resetFlow: () => void;
  onChange: (value: string) => void;
}

export function useInstantesCalculation(params: UseInstantesCalculationParams) {
  const {
    deltaOutMin,
    range,
    step,
    clockView,
    fromTime,
    setFromTime,
    setToTime,
    setStep,
    setClockView,
    setOpen,
    resetFlow,
    onChange,
  } = params;

  const minutesStep = Math.max(1, deltaOutMin > 0 ? deltaOutMin : 1);

  const handleClockChange = (newValue: Dayjs | null) => {
    if (!newValue || !range?.from || !range?.to || deltaOutMin <= 0) return;

    // Snap minutes to delta
    const snappedMinutes = snapMinutesToDelta(newValue.minute(), minutesStep);
    const next = newValue.minute(snappedMinutes).second(0).millisecond(0);

    // hours -> minutes
    if (clockView === "hours") {
      if (step === "fromTime") setFromTime(next);
      if (step === "toTime") setToTime(next);
      setClockView("minutes");
      return;
    }

    // minutes chosen -> advance / finish
    if (step === "fromTime") {
      setFromTime(next);
      setStep("toTime");
      setClockView("hours");
      return;
    }

    // step === "toTime": finalize diff and close
    setToTime(next);
    const dayTo = dateDiffInDays(range.to, range.from);
    if (dayTo < 0) return;

    const fromInst = computeInstanteFromDayTime({
      day: 0,
      hour: fromTime.hour(),
      minute: fromTime.minute(),
      deltaOutMin,
    });

    const toInst = computeInstanteFromDayTime({
      day: dayTo,
      hour: next.hour(),
      minute: next.minute(),
      deltaOutMin,
    });

    if (!Number.isInteger(fromInst) || !Number.isInteger(toInst)) return;

    const diff = toInst - fromInst;
    onChange(String(diff));
    setOpen(false);
    resetFlow();
  };

  return {
    minutesStep,
    handleClockChange,
  };
}
