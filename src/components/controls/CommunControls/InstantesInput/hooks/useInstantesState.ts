import {useState, useEffect} from "react";
import dayjs from "dayjs";
import {GENERIC_MONTH} from "../utils/timeCalculations";
import type {InstantesState, Step, ClockView} from "../types/instantes";

export function useInstantesState() {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<InstantesState["range"]>(undefined);
  const [calendarMonth, setCalendarMonth] = useState(GENERIC_MONTH);
  const [step, setStep] = useState<Step>("date");
  const [clockView, setClockView] = useState<ClockView>("hours");
  const [fromTime, setFromTime] = useState(() =>
    dayjs().hour(0).minute(0).second(0).millisecond(0)
  );
  const [toTime, setToTime] = useState(() =>
    dayjs().hour(0).minute(0).second(0).millisecond(0)
  );

  const resetFlow = () => {
    setRange(undefined);
    setStep("date");
    setClockView("hours");
    setFromTime(dayjs().hour(0).minute(0).second(0).millisecond(0));
    setToTime(dayjs().hour(0).minute(0).second(0).millisecond(0));
    setCalendarMonth(GENERIC_MONTH);
  };

  // When popover opens, force generic month
  useEffect(() => {
    if (!open) return;
    setCalendarMonth(GENERIC_MONTH);
  }, [open]);

  // When date range is complete, move to FROM time step
  useEffect(() => {
    if (!range?.from || !range?.to) return;
    setStep("fromTime");
    setClockView("hours");
  }, [range?.from, range?.to]);

  return {
    open,
    setOpen,
    range,
    setRange,
    calendarMonth,
    setCalendarMonth,
    step,
    setStep,
    clockView,
    setClockView,
    fromTime,
    setFromTime,
    toTime,
    setToTime,
    resetFlow,
  };
}
