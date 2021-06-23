import { reasons } from "components/forms/TimesheetForm";
import { DateTime } from "luxon";

declare global {
  interface Timestamps {
    created: string;
    changed: string;
  }

  interface Entity extends Timestamps {
    id: string;
  }

  interface UserAttributes {
    name: string;
    email: string;
    phoneNumber: string;
    acceptsReminders: boolean;
    isAdmin: boolean;
    defaultShiftValues: ShiftValues[];
  }

  interface User extends Entity, UserAttributes {}

  interface TimesheetAttributes {
    comment: string;
  }

  interface Timesheet extends Entity, TimesheetAttributes {
    userID: string;
    shifts: Shift[];
    absences: Absence[];
  }

  interface ShiftAttributes {
    start: string;
    end: string;
    breakDuration: number;
  }

  interface Shift extends Entity, ShiftAttributes {}

  interface AbsenceAttributes {
    date: string;
    reason: Reason;
  }

  interface Absence extends Entity, AbsenceAttributes {}

  interface PresetAttributes {
    value: ShiftValues[];
  }

  interface Preset extends Entity, PresetAttributes {
    userID: string;
  }

  interface SettingAttributes {
    name: string;
    value: string;
  }

  interface Setting extends Entity, SettingAttributes {}

  type Reason = keyof typeof reasons;

  interface ShiftValues {
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

  interface Settings {
    timesheetRecipients: string;
  }

  interface ResourceProps<T> {
    id: string;
    type: T;
  }

  interface Resource<T, A, R> extends ResourceProps<T> {
    attributes: Timestamps & A;
    relationships: R;
  }

  interface NewResource<T, A> {
    type: T;
    attributes: A;
  }

  interface RelatedResource<T> {
    data: ResourceProps<T>;
  }

  interface RelatedResourceArray<T> {
    data: ResourceProps<T>[];
  }

  interface UserResource
    extends Resource<
      "users",
      UserAttributes,
      {
        timesheets?: RelatedResourceArray<"timesheets">;
      }
    > {}

  interface NewUserResource extends NewResource<"users", UserAttributes, {}> {}

  interface TimesheetResource
    extends Resource<
      "timesheets",
      TimesheetAttributes,
      {
        user: RelatedResource<"users">;
        shifts?: RelatedResourceArray<"shifts">;
        absences?: RelatedResourceArray<"absences">;
      }
    > {}

  interface NewTimesheetResource
    extends NewResource<
      "timesheets",
      TimesheetAttributes,
      {
        user: RelatedResource<"users">;
      }
    > {}

  interface ShiftResource
    extends Resource<
      "shifts",
      ShiftAttributes,
      {
        timesheet: RelatedResource<"timesheets">;
      }
    > {}

  interface NewShiftResource
    extends NewResource<
      "shifts",
      ShiftAttributes,
      {
        timesheet: RelatedResource<"timesheets">;
      }
    > {}

  interface AbsenceResource
    extends Resource<
      "absences",
      AbsenceAttributes,
      {
        timesheet: RelatedResource<"timesheets">;
      }
    > {}

  interface NewAbsenceResource
    extends NewResource<
      "absences",
      AbsenceAttributes,
      {
        timesheet: RelatedResource<"timesheets">;
      }
    > {}

  interface PresetResource
    extends Resource<
      "presets",
      PresetAttributes,
      {
        user: RelatedResource<"users">;
      }
    > {}

  interface NewPresetResource
    extends NewResource<
      "presets",
      PresetAttributes,
      {
        user: RelatedResource<"users">;
      }
    > {}

  interface SettingResource
    extends Resource<"settings", SettingAttributes, {}> {}

  type MessageType = "success" | "warning" | "danger";

  interface Message {
    id: string;
    value: string | JSX.Element;
    type: MessageType;
    tags: string[];
    created: DateTime;
  }
}
