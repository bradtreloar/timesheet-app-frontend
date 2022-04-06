import { createEntitySlice } from "store/entity";
import { EntityState } from "store/types";
import {
  EntryActions,
  EntryKeys,
  Shift,
  ShiftAttributes,
} from "timesheets/types";

const shifts = createEntitySlice<"shifts", ShiftAttributes, EntryKeys>(
  "shifts",
  ({ start, end, breakDuration }: any): ShiftAttributes => ({
    start,
    end,
    breakDuration,
  }),
  {
    belongsTo: {
      type: "timesheets",
      foreignKey: "timesheet",
      backPopulates: "shifts",
    },
  }
);

export const selectShifts = (state: { shifts: EntityState<Shift> }) =>
  state.shifts;

export const actions = shifts.actions as EntryActions<
  typeof shifts.actions,
  ShiftAttributes
>;
export default shifts;
