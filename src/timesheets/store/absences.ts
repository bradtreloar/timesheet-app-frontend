import { createEntitySlice } from "store/entity";
import { EntityState } from "store/types";
import {
  Absence,
  AbsenceAttributes,
  EntryActions,
  EntryKeys,
} from "timesheets/types";

const absences = createEntitySlice<"absences", AbsenceAttributes, EntryKeys>(
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

export const actions = absences.actions as EntryActions<
  typeof absences.actions,
  AbsenceAttributes
>;
export default absences;
