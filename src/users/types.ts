import { EntityType } from "store/types";
import { ShiftValues } from "timesheets/types";

export interface UserSortOrder {
  attribute: keyof UserAttributes;
  ascending: boolean;
}

export interface UserAttributes {
  name: string;
  email: string;
  phoneNumber: string;
  acceptsReminders: boolean;
  isAdmin: boolean;
  defaultShiftValues: ShiftValues[];
}

export interface UserRelationships {
  timesheets: string[];
  presets: string[];
}

export type User = EntityType<UserAttributes> & {
  relationships: UserRelationships;
};
