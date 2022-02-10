import {
  AbsenceAttributes,
  PresetAttributes,
  SettingAttributes,
  ShiftAttributes,
  TimesheetAttributes,
  Timestamps,
  UserAttributes,
} from "store/types";

export interface ResourceProps<T> {
  id: string;
  type: T;
}

export interface Resource<T, A, R> extends ResourceProps<T> {
  attributes: Timestamps & A;
  relationships: R;
}

export interface NewResource<T, A> {
  type: T;
  attributes: A;
}

export interface RelatedResource<T> {
  data: ResourceProps<T>;
}

export interface RelatedResourceArray<T> {
  data: ResourceProps<T>[];
}

export interface UserResource
  extends Resource<
    "users",
    UserAttributes,
    {
      timesheets?: RelatedResourceArray<"timesheets">;
    }
  > {}

export interface NewUserResource extends NewResource<"users", UserAttributes> {}

export interface TimesheetResource
  extends Resource<
    "timesheets",
    TimesheetAttributes,
    {
      user: RelatedResource<"users">;
      shifts?: RelatedResourceArray<"shifts">;
      absences?: RelatedResourceArray<"absences">;
    }
  > {}

export interface NewTimesheetResource
  extends NewResource<"timesheets", TimesheetAttributes> {}

export interface ShiftResource
  extends Resource<
    "shifts",
    ShiftAttributes,
    {
      timesheet: RelatedResource<"timesheets">;
    }
  > {}

export interface NewShiftResource
  extends NewResource<"shifts", ShiftAttributes> {}

export interface AbsenceResource
  extends Resource<
    "absences",
    AbsenceAttributes,
    {
      timesheet: RelatedResource<"timesheets">;
    }
  > {}

export interface NewAbsenceResource
  extends NewResource<"absences", AbsenceAttributes> {}

export interface PresetResource
  extends Resource<
    "presets",
    PresetAttributes,
    {
      user: RelatedResource<"users">;
    }
  > {}

export interface NewPresetResource
  extends NewResource<"presets", PresetAttributes> {}

export interface SettingResource
  extends Resource<"settings", SettingAttributes, {}> {}
