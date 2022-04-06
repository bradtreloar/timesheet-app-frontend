import { Entity, EntityAttributes, EntityKeys } from "store/types";
import { ShiftValues } from "timesheets/types";

export interface UserSortOrder {
  attribute: keyof UserAttributes;
  ascending: boolean;
}

export interface UserAttributes extends EntityAttributes {
  name: string;
  email: string;
  phoneNumber: string;
  acceptsReminders: boolean;
  isAdmin: boolean;
  defaultShiftValues: ShiftValues[];
}

export interface UserKeys extends EntityKeys {
  timesheets: string[];
  presets: string[];
}

export type User = Entity<UserAttributes, UserKeys>;
