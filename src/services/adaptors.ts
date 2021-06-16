import { omit } from "lodash";
import { getShiftHoursFromTimes } from "services/date";
import { Time } from "./date";

export const parseSetting = (resource: SettingResource): Setting => ({
  id: resource.id,
  ...resource.attributes,
});

export const parseAbsence = (resource: AbsenceResource): Absence => ({
  id: resource.id,
  ...resource.attributes,
});

export const parseShift = (resource: ShiftResource): Shift => ({
  id: resource.id,
  ...resource.attributes,
});

export const parseTimesheet = (resource: TimesheetResource): Timesheet => ({
  id: resource.id,
  userID: resource.relationships.user.data.id,
  shifts: [],
  absences: [],
  ...resource.attributes,
});

export const parseUser = (resource: UserResource): User => ({
  id: resource.id,
  ...resource.attributes,
});

export const makeSettingResource = (setting: Setting): SettingResource => {
  const resource: SettingResource = {
    id: setting.id,
    type: "settings",
    attributes: omit(setting, ["id"]),
    relationships: {},
  };
  return resource;
};

export const makeNewShiftResource = (
  shiftAttributes: ShiftAttributes,
  timesheet: Timesheet
): NewShiftResource => ({
  type: "shifts",
  attributes: shiftAttributes,
  relationships: {
    timesheet: {
      data: {
        id: timesheet.id,
        type: "timesheets",
      },
    },
  },
});

export const makeShiftResource = (
  shift: Shift,
  timesheet: Timesheet
): ShiftResource => ({
  id: shift.id,
  type: "shifts",
  attributes: omit(shift, ["id"]),
  relationships: {
    timesheet: {
      data: {
        id: timesheet.id,
        type: "timesheets",
      },
    },
  },
});

export const makeNewAbsenceResource = (
  shiftAttributes: AbsenceAttributes,
  timesheet: Timesheet
): NewAbsenceResource => ({
  type: "absences",
  attributes: shiftAttributes,
  relationships: {
    timesheet: {
      data: {
        id: timesheet.id,
        type: "timesheets",
      },
    },
  },
});

export const makeAbsenceResource = (
  absence: Absence,
  timesheet: Timesheet
): AbsenceResource => ({
  id: absence.id,
  type: "absences",
  attributes: omit(absence, ["id"]),
  relationships: {
    timesheet: {
      data: {
        id: timesheet.id,
        type: "timesheets",
      },
    },
  },
});

export const makeNewTimesheetResource = (
  timesheetAttributes: TimesheetAttributes,
  user: User
): NewTimesheetResource => ({
  type: "timesheets",
  attributes: omit(timesheetAttributes, ["userID"]),
  relationships: {
    user: {
      data: {
        id: user.id,
        type: "users",
      },
    },
  },
});

export const makeTimesheetResource = (
  timesheet: Timesheet
): TimesheetResource => ({
  id: timesheet.id,
  type: "timesheets",
  attributes: omit(timesheet, ["id", "userID"]),
  relationships: {
    user: {
      data: {
        id: timesheet.userID,
        type: "users",
      },
    },
  },
});

export const makeNewUserResource = (
  userAttributes: UserAttributes
): NewUserResource => ({
  type: "users",
  attributes: userAttributes,
  relationships: {},
});

export const makeUserResource = (user: User): UserResource => ({
  id: user.id,
  type: "users",
  attributes: omit(user, ["id"]),
  relationships: {},
});

export const getShiftFromTimes = (
  date: Date,
  shiftValues: ShiftValues
): ShiftAttributes => {
  if (shiftValues === null) {
    throw new Error(`No shift times.`);
  }

  const { startTime, endTime, breakDuration } = shiftValues;
  const shiftDuration = getShiftHoursFromTimes(shiftValues);

  if (shiftDuration === null || shiftDuration <= 0) {
    throw new Error(`Invalid shift times.`);
  }

  return {
    start: Time.fromObject(startTime).toDateTime(date).toISO(),
    end: Time.fromObject(endTime).toDateTime(date).toISO(),
    breakDuration: Time.fromObject(breakDuration).toMinutes(),
  };
};

export const getTimesFromShift = (shift: Shift): ShiftValues => {
  const start = new Date(shift.start);
  const end = new Date(shift.end);
  const breakHours = Math.floor(shift.breakDuration / 60);
  const breakMinutes = shift.breakDuration % 60;

  return {
    isActive: true,
    reason: "none",
    startTime: {
      hour: start.getHours().toString(),
      minute: start.getMinutes().toString(),
    },
    endTime: {
      hour: end.getHours().toString(),
      minute: end.getMinutes().toString(),
    },
    breakDuration: {
      hour: breakHours.toString(),
      minute: breakMinutes.toString(),
    },
  };
};
