import { reasons } from "timesheets/forms/TimesheetForm";
import { Entity, EntityAttributes, EntityKeys } from "store/types";
import { AsyncThunk } from "@reduxjs/toolkit";

export type Reason = keyof typeof reasons;

export interface TimesheetAttributes extends EntityAttributes {
  comment: string;
  submitted: string | null;
}

export interface TimesheetKeys extends EntityKeys {
  user: string;
  shifts: string[];
  absences: string[];
}

export type Timesheet = Entity<TimesheetAttributes, TimesheetKeys>;

export interface EntryKeys extends EntityKeys {
  timesheet: string;
}

export interface ShiftAttributes extends EntityAttributes {
  start: string;
  end: string;
  breakDuration: number;
}

export interface AbsenceAttributes {
  date: string;
  reason: Reason;
}

export type Shift = Entity<ShiftAttributes, EntryKeys>;

export type Absence = Entity<AbsenceAttributes, EntryKeys>;

export type Entry = Shift | Absence;

export interface PresetAttributes {
  value: ShiftValues[];
}

export interface PresetKeys extends EntityKeys {
  user: string;
}

export type Preset = Entity<PresetAttributes, PresetKeys>;

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

export type EntryActions<Actions, A extends EntityAttributes> = Actions & {
  fetchAllBelongingTo: AsyncThunk<Entity<A, EntryKeys>[], string, {}>;
  addBelongingTo: AsyncThunk<
    Entity<A, EntryKeys>,
    {
      attributes: A;
      belongsToID: string;
    },
    {}
  >;
};
