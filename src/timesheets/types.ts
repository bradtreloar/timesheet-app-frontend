import { reasons } from "timesheets/forms/TimesheetForm";
import { EntityType } from "store/types";

export type Reason = keyof typeof reasons;

export interface TimesheetAttributes {
  comment: string;
  submitted: string | null;
}

export interface TimesheetRelationships {
  user: string;
  shifts: string[];
  absences: string[];
}

export type Timesheet = EntityType<TimesheetAttributes> & {
  relationships: TimesheetRelationships;
};

export interface ShiftAttributes {
  start: string;
  end: string;
  breakDuration: number;
}

export interface EntryRelationships {
  timesheet: string;
}

export type Shift = EntityType<ShiftAttributes> & {
  relationships: EntryRelationships;
};

export interface AbsenceAttributes {
  date: string;
  reason: Reason;
}

export type Absence = EntityType<AbsenceAttributes> & {
  relationships: EntryRelationships;
};

export interface PresetAttributes {
  value: ShiftValues[];
}

export interface PresetRelationships {
  user: string;
}

export type Preset = EntityType<PresetAttributes> & {
  relationships: PresetRelationships;
};

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
