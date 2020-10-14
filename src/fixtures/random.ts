import { Store } from "redux";
import { Shift, Timesheet, User } from "../types";
import randomstring from "randomstring";
import { addDays, addHours, SimpleTime } from "../helpers/date";

const formattedDate = (date: Date) =>
  `${date.getDay()}-${date.getMonth()}-${date.getFullYear()}`;

const randomID = () => randomstring.generate();

const range = (length: number) => [...Array.from(new Array(length).keys())];

export const randomUser = (userIsAdmin?: boolean): User => {
  const isAdmin = userIsAdmin !== undefined && userIsAdmin;
  return {
    id: randomID(),
    name: randomstring.generate({
      length: 12,
      charset: "alphabetic",
    }),
    email: `${randomstring.generate({
      length: 12,
      charset: "alphabetic",
      capitalization: "lowercase",
    })}@example.com`,
    isAdmin: userIsAdmin === true,
  };
};

export const randomPassword = () => randomstring.generate();

export const randomInt = (min: number, max: number) => {
  const range = max - min;
  return Math.floor(Math.random() * range);
};

export const randomMinutes = (min: number, max: number) => {
  return randomInt(min, max);
};

export const randomSimpleTime = (min: string, max: string) => {
  const [minHours, minMinutes] = SimpleTime.fromString(min).toArray();
  const [maxHours, maxMinutes] = SimpleTime.fromString(max).toArray();
  const hours = randomInt(minHours, maxHours);
  const minutes = randomInt(minMinutes, maxMinutes);
  return new SimpleTime(hours, minutes);
};

/**
 * Generates random dates that are up to 12 hours apart and are within 24 hours
 * of the given date.
 *
 * @param date
 */
export const randomShiftDates = (date: Date) => {
  const shiftDuration = Math.floor(Math.random() * 12);
  const startHours = Math.floor(Math.random() * 12);
  const start = addHours(date, startHours).toISOString();
  const end = addHours(date, startHours + shiftDuration).toISOString();
  return [start, end];
};

export const randomTimesheet = (user: User): Timesheet => {
  const weekStartDate = new Date(Date.now());
  const shifts = range(5).map(
    (days): Shift => {
      const [start, end] = randomShiftDates(addDays(weekStartDate, days));
      return {
        start,
        end,
        breakDuration: randomMinutes(30, 60),
      };
    }
  );
  return {
    id: randomID(),
    userID: user.id,
    shifts,
    created: new Date().toISOString(),
  };
};

export const randomTimesheets = (user: User, count: number) =>
  range(count).map((index) => randomTimesheet(user));