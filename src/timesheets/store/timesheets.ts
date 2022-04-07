import { createEntitySlice } from "store/entity";
import { Entity, EntityState } from "store/types";
import { getEntryDate } from "timesheets/helpers";
import {
  Absence,
  AbsenceAttributes,
  Entry,
  Shift,
  ShiftAttributes,
  Timesheet,
  TimesheetAttributes,
  TimesheetKeys,
} from "timesheets/types";
import { BaseException } from "utils/exceptions";

const timesheets = createEntitySlice<
  "timesheets",
  TimesheetAttributes,
  TimesheetKeys
>(
  "timesheets",
  ({ comment, submitted }: any): TimesheetAttributes => ({
    comment,
    submitted,
  }),
  {
    belongsTo: {
      type: "users",
      foreignKey: "user",
      backPopulates: "timesheets",
    },
    hasMany: [
      {
        type: "shifts",
        foreignKey: "shifts",
        backPopulates: "timesheet",
      },
      {
        type: "absences",
        foreignKey: "absences",
        backPopulates: "timesheet",
      },
    ],
  }
);

export const selectTimesheets = (state: {
  timesheets: EntityState<Timesheet>;
}) => state.timesheets;

export class UndefinedEntryException extends BaseException {
  constructor(id: string) {
    super(`Cannot find entry with ID ${id}`);
  }
}

export const selectTimesheetEntries = (timesheet: Timesheet) => (state: {
  shifts: EntityState<Shift>;
  absences: EntityState<Absence>;
}) => {
  const entries = [] as Entry[];

  timesheet.relationships.shifts.forEach((id) => {
    const entry = state.shifts.entities.byID[id];
    if (entry !== undefined) {
      entries.push(entry);
    } else {
      throw new UndefinedEntryException(id);
    }
  });

  timesheet.relationships.absences.forEach((id) => {
    const entry = state.absences.entities.byID[id];
    if (entry !== undefined) {
      entries.push(entry);
    } else {
      throw new UndefinedEntryException(id);
    }
  });

  entries.sort((a, b) => {
    const aDate = getEntryDate(a);
    const bDate = getEntryDate(b);
    return aDate.diff(bDate).toMillis();
  });

  return entries;
};

export const { actions } = timesheets;
export default timesheets;
