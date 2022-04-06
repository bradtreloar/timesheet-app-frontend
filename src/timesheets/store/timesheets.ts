import { createEntitySlice } from "store/entity";
import { Entity, EntityState } from "store/types";
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

class UndefinedEntryException extends Error {
  constructor(id: string) {
    super(id);
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

  return entries;
};

export const { actions } = timesheets;
export default timesheets;
