import { Setting, SettingAttributes } from "settings/types";
import { createEntitySlice } from "store/entity";
import { EntityState } from "store/types";

export const getAttributes = ({ name, value }: any): SettingAttributes => ({
  name,
  value,
});

export const relationships = {};

const settings = createEntitySlice("settings", getAttributes, relationships);

export const selectSettings = (state: { settings: EntityState<Setting> }) =>
  state.settings;

export const { actions } = settings;
export default settings;
