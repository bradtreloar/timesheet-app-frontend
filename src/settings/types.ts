import { EntityType } from "store/types";

export interface SettingAttributes {
  name: string;
  value: string;
}

export type Setting = EntityType<SettingAttributes>;

export interface Settings {
  timesheetRecipients: string;
}
