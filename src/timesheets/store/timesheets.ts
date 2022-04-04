import { createEntitySlice } from "store/entity";
import { EntityState } from "store/types";
import { Timesheet, TimesheetAttributes } from "timesheets/types";

const timesheets = createEntitySlice(
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

export const { actions } = timesheets;
export default timesheets;
