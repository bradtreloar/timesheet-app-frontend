import { Time } from "utils/date";
import { Shift, ShiftValues } from "./types";

/**
 * Calculates a shift duration in hours from a set of times.
 *
 * @param shiftValues
 */
export const getShiftHoursFromTimes = (shiftValues: ShiftValues) => {
  const startTime = Time.fromObject(shiftValues.startTime);
  const endTime = Time.fromObject(shiftValues.endTime);
  const breakDuration = Time.fromObject(shiftValues.breakDuration);

  const shiftMinutes =
    endTime.toMinutes() - startTime.toMinutes() - breakDuration.toMinutes();
  if (shiftMinutes <= 0) {
    return 0;
  }

  return Time.fromMinutes(shiftMinutes).toHours();
};

/**
 * Calculates a shift duration in hours from a set of dates.
 */
export const getShiftHours = (shift: Shift) => {
  const { start, end, breakDuration } = shift.attributes;
  // Get the difference between start and end times, minus break duration.
  const shiftMinutes =
    (new Date(end).getTime() - new Date(start).getTime()) / 60000 -
    breakDuration;
  return shiftMinutes / 60;
};
