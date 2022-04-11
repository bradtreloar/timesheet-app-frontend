import { AsyncThunk } from "@reduxjs/toolkit";
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

export const actions = timesheets.actions as typeof timesheets.actions & {
  fetchAllBelongingTo: AsyncThunk<
    Entity<TimesheetAttributes, TimesheetKeys>[],
    string,
    {}
  >;
  addBelongingTo: AsyncThunk<
    Entity<TimesheetAttributes, TimesheetKeys>,
    {
      attributes: TimesheetAttributes;
      belongsToID: string;
    },
    {}
  >;
};
export default timesheets;
