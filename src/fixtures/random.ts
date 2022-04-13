import Randomstring from "randomstring";
import { Time } from "utils/date";
import faker from "faker";
import { defaults, random, random as randomNumber, range } from "lodash";
import { DateTime } from "luxon";
import { reasons } from "timesheets/forms/TimesheetForm";
import {
  Absence,
  Preset,
  Shift,
  ShiftValues,
  Timesheet,
} from "timesheets/types";
import { Setting, SettingsValues } from "settings/types";
import { User } from "users/types";
import { CurrentUser } from "auth/types";

export const randomID = () => faker.random.uuid();

export const randomDateTime = () => DateTime.fromSeconds(random(100000));

export const randomTimestamps = () => ({
  changed: DateTime.local().toISO(),
  created: DateTime.local().toISO(),
});

export const randomCurrentUser = (
  partialCurrentUser?: Partial<CurrentUser>
): CurrentUser =>
  defaults(partialCurrentUser, {
    id: randomID(),
    ...randomTimestamps(),
    name: faker.name.findName(),
    email: faker.internet.email(),
    phoneNumber: faker.phone.phoneNumber("04## ### ###"),
    acceptsReminders: true,
    isAdmin: false,
    defaultShiftValues: range(7).map((index) => randomShiftValues()),
  });

export const randomUser = (partialUser?: Partial<User>): User =>
  defaults(partialUser, {
    id: randomID(),
    ...randomTimestamps(),
    attributes: {
      name: faker.name.findName(),
      email: faker.internet.email(),
      phoneNumber: faker.phone.phoneNumber("04## ### ###"),
      acceptsReminders: true,
      isAdmin: false,
      defaultShiftValues: range(7).map((index) => randomShiftValues()),
    },
    relationships: {
      timesheets: [],
      presets: [],
    },
  });

export const randomUsers = (count: number) =>
  range(count).map(() => randomUser());

export const randomPassword = () => Randomstring.generate();

export const randomToken = () => Randomstring.generate();

export const randomBoolean = () => Math.random() > 0.5;

export const randomInt = (min: number, max: number) => randomNumber(min, max);

export const randomMinutes = (min: number, max: number) => {
  return randomInt(min, max);
};

export const randomTime = (min: string, max: string) => {
  const [minHours, minMinutes] = Time.fromString(min).toArray();
  const [maxHours, maxMinutes] = Time.fromString(max).toArray();
  const hour = randomInt(minHours as number, maxHours as number);
  const minute = randomInt(minMinutes as number, maxMinutes as number);
  return new Time(hour, minute);
};

export const randomShiftValuesArray = (): ShiftValues[] =>
  range(7).map(() => randomShiftValues());

export const randomReason = () => {
  const reasonKeys = Object.keys(reasons);
  return reasonKeys[
    randomInt(0, reasonKeys.length - 1)
  ] as keyof typeof reasons;
};

/**
 * Generates random ShiftValues
 *
 * @param date
 */
export const randomShiftValues = (): ShiftValues => {
  const shiftDuration = Math.floor(Math.random() * 9) + 3;
  const breakMinutes = Math.floor(Math.random() * 15) + 30;
  const startHours = Math.floor(Math.random() * 12);
  const endHours = startHours + shiftDuration;
  const startMinutes = Math.floor(Math.random() * 60);
  const endMinutes = Math.floor(Math.random() * 60);
  return {
    isActive: true,
    reason: "none",
    startTime: {
      hour: startHours.toString(),
      minute: startMinutes.toString(),
    },
    endTime: {
      hour: endHours.toString(),
      minute: endMinutes.toString(),
    },
    breakDuration: {
      hour: "0",
      minute: breakMinutes.toString(),
    },
  };
};

/**
 * Generates random dates that are up to 12 hours apart and are within 24 hours
 * of the given date.
 *
 * @param date
 */
export const randomShiftDates = (datetime: DateTime) => {
  const shiftDuration = Math.floor(Math.random() * 9) + 3;
  const startHour = Math.floor(Math.random() * 12);
  const start = datetime.plus({ hours: startHour });
  const end = start.plus({ hours: shiftDuration });
  return [start, end];
};

export const randomShift = (
  timesheet: Timesheet,
  dateTime: DateTime
): Shift => {
  const [start, end] = randomShiftDates(dateTime);
  return {
    id: randomID(),
    ...randomTimestamps(),
    attributes: {
      start: start.toISO(),
      end: end.toISO(),
      breakDuration: randomMinutes(30, 60),
    },
    relationships: {
      timesheet: timesheet.id,
    },
  };
};

export const randomAbsence = (
  timesheet: Timesheet,
  dateTime: DateTime
): Absence => {
  return {
    id: randomID(),
    ...randomTimestamps(),
    attributes: {
      date: dateTime.toISO(),
      reason: "rostered-day-off",
    },
    relationships: {
      timesheet: timesheet.id,
    },
  };
};

export const randomTimesheet = (
  user: User | CurrentUser,
  partialTimesheet?: Partial<Timesheet>
): Timesheet => {
  return defaults(partialTimesheet, {
    id: randomID(),
    ...randomTimestamps(),
    attributes: {
      comment: Randomstring.generate(60),
      submitted: DateTime.local().toISO(),
    },
    relationships: {
      user: user.id,
      shifts: [],
      absences: [],
    },
  });
};

export const randomTimesheets = (user: User | CurrentUser, count?: number) =>
  range(count || 5).map(() => randomTimesheet(user));

export const randomSettings = (
  settings?: {
    [P in keyof SettingsValues]?: string;
  }
): Setting[] => [
  {
    id: randomID(),
    ...randomTimestamps(),
    attributes: {
      name: "timesheetRecipients",
      value: settings?.timesheetRecipients || faker.internet.email(),
    },
    relationships: {},
  },
];

export const randomSettingsObject = (): SettingsValues => ({
  timesheetRecipients: faker.internet.email(),
});

export const randomPreset = (
  user: User,
  partialPreset?: Partial<Preset>
): Preset =>
  defaults(partialPreset, {
    id: randomID(),
    ...randomTimestamps(),
    attributes: {
      value: range(7).map((index) => randomShiftValues()),
    },
    relationships: {
      user: user.id,
    },
  });

export const randomPresets = (user: User, count?: number) =>
  range(count || 5).map(() => randomPreset(user));
