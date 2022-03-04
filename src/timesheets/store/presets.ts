import { createEntitySlice } from "store/entity";
import { EntityState } from "store/types";
import { Preset, PresetAttributes } from "timesheets/types";

const presets = createEntitySlice(
  "presets",
  ({ value }: any): PresetAttributes => ({ value }),
  {
    belongsTo: {
      type: "users",
      foreignKey: "user",
      backPopulates: "presets",
    },
  }
);

export const selectPresets = (state: { presets: EntityState<Preset> }) =>
  state.presets;

export const { actions } = presets;
export default presets;
