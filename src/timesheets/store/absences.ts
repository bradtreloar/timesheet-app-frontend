import { createEntitySlice } from "store/entity";
import { EntityState } from "store/types";
import { Absence, AbsenceAttributes } from "timesheets/types";

const absences = createEntitySlice(
  "absences",
  ({ date, reason }: any): AbsenceAttributes => ({
    date,
    reason,
  }),
  {
    belongsTo: {
      type: "timesheets",
      foreignKey: "timesheet",
      backPopulates: "absences",
    },
  }
);

export const selectAbsences = (state: { absences: EntityState<Absence> }) =>
  state.absences;

export const { actions } = absences;
export default absences;
