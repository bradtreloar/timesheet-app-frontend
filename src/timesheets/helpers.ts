import { DateTime } from "luxon";
import { EntityState } from "store/types";
import { Time } from "utils/date";
import {
  Absence,
  AbsenceAttributes,
  Entry,
  Shift,
  ShiftAttributes,
  ShiftValues,
  Timesheet,
} from "./types";

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

export const getEntryDate = (entry: Shift | Absence) => {
  const { attributes } = entry;
  const date =
    attributes.date !== undefined
      ? (attributes as AbsenceAttributes).date
      : (attributes as ShiftAttributes).start;
  return DateTime.fromISO(date);
};

export const isMissingShifts = (
  timesheet: Timesheet,
  shiftsState: EntityState<Shift>
) => {
  const timesheetShiftIDs = timesheet.relationships.shifts;
  const allShiftIDs = shiftsState.entities.allIDs;
  return !timesheetShiftIDs.every((id) => allShiftIDs.includes(id));
};

export const isMissingAbsences = (
  timesheet: Timesheet,
  absencesState: EntityState<Absence>
) => {
  const timesheetAbsenceIDs = timesheet.relationships.absences;
  const allAbsenceIDs = absencesState.entities.allIDs;
  return !timesheetAbsenceIDs.every((id) => allAbsenceIDs.includes(id));
};

export const getTimesheetEntries = (
  timesheet: Timesheet,
  shiftsState: EntityState<Shift>,
  absencesState: EntityState<Absence>
) => {
  const entries = [] as Entry[];
  timesheet.relationships.shifts.forEach((id) => {
    entries.push(shiftsState.entities.byID[id]);
  });
  timesheet.relationships.absences.forEach((id) => {
    entries.push(absencesState.entities.byID[id]);
  });
  entries.sort((a: Entry, b: Entry) => {
    const aDate = getEntryDate(a);
    const bDate = getEntryDate(b);
    return aDate.diff(bDate).toMillis();
  });
  return entries;
};
