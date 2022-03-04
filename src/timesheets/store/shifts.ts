import { createEntitySlice } from "store/entity";
import { EntityState } from "store/types";
import { Shift, ShiftAttributes } from "timesheets/types";

const shifts = createEntitySlice(
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

export const { actions } = shifts;
export default shifts;
