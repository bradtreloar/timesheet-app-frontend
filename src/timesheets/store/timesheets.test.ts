import {
  randomAbsence,
  randomShift,
  randomTimesheet,
  randomUser,
} from "fixtures/random";
import { DateTime } from "luxon";
import createStore from "store/createStore";
import { buildEntityState } from "store/entity";
import absences from "./absences";
import shifts from "./shifts";
import timesheets, {
  selectTimesheetEntries,
  selectTimesheets,
} from "./timesheets";

describe("selectTimesheetEntries", () => {
  it("returns timesheet's shifts from store", () => {
    const store = createStore();
    const user = randomUser();
    let timesheet = randomTimesheet(user);
    const shift = randomShift(timesheet, DateTime.local().minus({ days: 1 }));
    store.dispatch(timesheets.actions.set(buildEntityState([timesheet])));
    store.dispatch(shifts.actions.set(buildEntityState([shift])));

    timesheet = selectTimesheets(store.getState()).entities.byID[timesheet.id];

    const entries = selectTimesheetEntries(timesheet)(store.getState());

    expect(entries).toStrictEqual([shift]);
  });

  it("returns timesheet's absences from store", () => {
    const store = createStore();
    const user = randomUser();
    let timesheet = randomTimesheet(user);
    const absence = randomAbsence(
      timesheet,
      DateTime.local().minus({ days: 1 })
    );
    store.dispatch(timesheets.actions.set(buildEntityState([timesheet])));
    store.dispatch(absences.actions.set(buildEntityState([absence])));
    timesheet = selectTimesheets(store.getState()).entities.byID[timesheet.id];

    const entries = selectTimesheetEntries(timesheet)(store.getState());

    expect(entries).toStrictEqual([absence]);
  });

  it("returns timesheet's entries in date order", () => {
    const store = createStore();
    const user = randomUser();
    let timesheet = randomTimesheet(user);
    const shift1 = randomShift(timesheet, DateTime.local().minus({ days: 1 }));
    const absence = randomAbsence(
      timesheet,
      DateTime.local().minus({ days: 2 })
    );
    const shift2 = randomShift(timesheet, DateTime.local().minus({ days: 3 }));
    store.dispatch(timesheets.actions.set(buildEntityState([timesheet])));
    store.dispatch(shifts.actions.set(buildEntityState([shift1, shift2])));
    store.dispatch(absences.actions.set(buildEntityState([absence])));
    timesheet = selectTimesheets(store.getState()).entities.byID[timesheet.id];

    const entries = selectTimesheetEntries(timesheet)(store.getState());

    expect(entries).toStrictEqual([shift2, absence, shift1]);
  });
});
