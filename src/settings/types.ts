import { Entity, EntityAttributes } from "store/types";

export interface SettingAttributes extends EntityAttributes {
  name: string;
  value: string;
}

export type Setting = Entity<SettingAttributes, {}>;

export interface Settings {
  timesheetRecipients: string;
}
