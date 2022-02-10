import { reasons } from "components/forms/TimesheetForm";

export type Reason = keyof typeof reasons;

export interface Timestamps {
  created: string;
  changed: string;
}

export interface Entity extends Timestamps {
  id: string;
}

export interface UserAttributes {
  name: string;
  email: string;
  phoneNumber: string;
  acceptsReminders: boolean;
  isAdmin: boolean;
  defaultShiftValues: ShiftValues[];
}

export interface User extends Entity, UserAttributes {}

export interface TimesheetAttributes {
  comment: string;
}

export interface Timesheet extends Entity, TimesheetAttributes {
  userID: string;
  shifts: Shift[];
  absences: Absence[];
}

export interface ShiftAttributes {
  start: string;
  end: string;
  breakDuration: number;
}

export interface Shift extends Entity, ShiftAttributes {}

export interface AbsenceAttributes {
  date: string;
  reason: Reason;
}

export interface Absence extends Entity, AbsenceAttributes {}

export interface PresetAttributes {
  value: ShiftValues[];
}

export interface Preset extends Entity, PresetAttributes {
  userID: string;
}

export interface SettingAttributes {
  name: string;
  value: string;
}

export interface Setting extends Entity, SettingAttributes {}

export interface ShiftValues {
  isActive: boolean;
  reason: Reason;
  startTime: {
    hour: string;
    minute: string;
  };
  endTime: {
    hour: string;
    minute: string;
  };
  breakDuration: {
    hour: string;
    minute: string;
  };
}

export interface Settings {
  timesheetRecipients: string;
}

//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

// export type StoreStatus = "idle" | "pending" | "fulfilled" | "rejected";

// export interface Entity extends Timestamps {
//   id: string;
// }

// export type EntityType<Attributes> = Entity & Attributes;

// export interface EntitiesByID<T> {
//   [key: string]: T;
// }

// export interface EntityStateData<T> {
//   byID: EntitiesByID<T>;
//   allIDs: string[];
// }

// export interface EntityState<T> {
//   entities: EntityStateData<T>;
//   status: StoreStatus;
//   error?: string;
// }
