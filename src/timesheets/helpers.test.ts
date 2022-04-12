import {
  randomAbsence,
  randomID,
  randomShift,
  randomTimesheet,
  randomUser,
} from "fixtures/random";
import { range } from "lodash";
import { DateTime } from "luxon";
import { buildEntityState } from "store/entity";
import {
  getEntryDate,
  isMissingShifts,
  getTimesheetEntries,
} from "./helpers";

describe("getEntryDate", () => {
  it("returns the start date for a shift", () => {
    const shift = randomShift(randomTimesheet(randomUser()), DateTime.local());

    expect(getEntryDate(shift)).toStrictEqual(
      DateTime.fromISO(shift.attributes.start)
    );
  });

  it("returns the start date for an absence", () => {
    const absence = randomAbsence(
      randomTimesheet(randomUser()),
      DateTime.local()
    );

    expect(getEntryDate(absence)).toStrictEqual(
      DateTime.fromISO(absence.attributes.date)
    );
  });
});

describe("isMissingShifts", () => {
  it("returns false when shifts state contains all timesheet shift IDs", () => {
    const timesheet = randomTimesheet(randomUser());
    const shifts = range(7).map((index) =>
      randomShift(timesheet, DateTime.local().plus({ days: index }))
    );
    const shiftIDs = shifts.map(({ id }) => id);
    timesheet.relationships.shifts = shiftIDs;
    const shiftsState = buildEntityState(shifts);

    expect(isMissingShifts(timesheet, shiftsState)).toBe(false);
  });

  it("returns true when shifts state is missing at least one timesheet shift ID", () => {
    const timesheet = randomTimesheet(randomUser());
    const shifts = range(6).map((index) =>
      randomShift(timesheet, DateTime.local().plus({ days: index }))
    );
    const shiftIDs = shifts.map(({ id }) => id);
    timesheet.relationships.shifts = [...shiftIDs, randomID()];
    const shiftsState = buildEntityState(shifts);

    expect(isMissingShifts(timesheet, shiftsState)).toBe(true);
  });
});

describe("isMissingAbsences", () => {
  it("returns false when absences state contains all timesheet absence IDs", () => {
    const timesheet = randomTimesheet(randomUser());
    const shifts = range(7).map((index) =>
      randomShift(timesheet, DateTime.local().plus({ days: index }))
    );
    const shiftIDs = shifts.map(({ id }) => id);
    timesheet.relationships.shifts = shiftIDs;
    const shiftsState = buildEntityState(shifts);

    expect(isMissingShifts(timesheet, shiftsState)).toBe(false);
  });

  it("returns true when absences state is missing at least one timesheet absence ID", () => {
    const timesheet = randomTimesheet(randomUser());
    const shifts = range(6).map((index) =>
      randomShift(timesheet, DateTime.local().plus({ days: index }))
    );
    const shiftIDs = shifts.map(({ id }) => id);
    timesheet.relationships.shifts = [...shiftIDs, randomID()];
    const shiftsState = buildEntityState(shifts);

    expect(isMissingShifts(timesheet, shiftsState)).toBe(true);
  });
});

describe("selectTimesheetEntries", () => {
  it("selects timesheet shifts", () => {
    const timesheet = randomTimesheet(randomUser());
    const shifts = range(3).map((index) =>
      randomShift(timesheet, DateTime.local().plus({ days: index }))
    );
    timesheet.relationships.shifts = shifts.map(({ id }) => id);

    expect(
      getTimesheetEntries(
        timesheet,
        buildEntityState(shifts),
        buildEntityState([])
      )
    ).toStrictEqual(shifts);
  });

  it("selects timesheet absences", () => {
    const timesheet = randomTimesheet(randomUser());
    const absences = range(3).map((index) =>
      randomAbsence(timesheet, DateTime.local().plus({ days: index }))
    );
    timesheet.relationships.absences = absences.map(({ id }) => id);

    expect(
      getTimesheetEntries(
        timesheet,
        buildEntityState([]),
        buildEntityState(absences)
      )
    ).toStrictEqual(absences);
  });

  it("returns mixed timesheet entries in date order", () => {
    const timesheet = randomTimesheet(randomUser());
    const shift1 = randomShift(timesheet, DateTime.local().plus({ days: 1 }));
    const absence2 = randomAbsence(
      timesheet,
      DateTime.local().plus({ days: 2 })
    );
    const shift3 = randomShift(timesheet, DateTime.local().plus({ days: 3 }));
    const absence4 = randomAbsence(
      timesheet,
      DateTime.local().plus({ days: 4 })
    );
    timesheet.relationships.shifts = [shift1.id, shift3.id];
    timesheet.relationships.absences = [absence2.id, absence4.id];

    expect(
      getTimesheetEntries(
        timesheet,
        buildEntityState([shift1, shift3]),
        buildEntityState([absence2, absence4])
      )
    ).toStrictEqual([shift1, absence2, shift3, absence4]);
  });
});
