import {
  randomAbsence,
  randomShift,
  randomTimesheet,
  randomUser,
} from "fixtures/random";
import { buildEntityState, createAsyncEntityActions } from "store/entity";
import { fetchTimesheetEntries } from ".";
import { actions as timesheetActions } from "./timesheets";
import { actions as shiftActions } from "./shifts";
import { actions as absenceActions } from "./absences";
import createStore, { AppStore } from "store/createStore";
import {
  AbsenceAttributes,
  Shift,
  ShiftAttributes,
  Timesheet,
} from "timesheets/types";
import assert from "assert";
import { AsyncThunk, createAsyncThunk } from "@reduxjs/toolkit";
import { EntityType } from "store/types";
import { DateTime } from "luxon";
import { EntryActions } from "./types";

const seedStore = (timesheets: Timesheet[]) => {
  const store = createStore();
  store.dispatch(timesheetActions.set(buildEntityState(timesheets)));
  return store;
};

const createMockAsyncThunk = <A>(
  entityType: string,
  payload: EntityType<A>[]
) =>
  createAsyncThunk(
    `${entityType}/fetchAllBelongingTo`,
    async (belongsToID: string) => Promise.resolve(payload)
  );

describe("fetchTimesheetEntries", () => {
  it("dispatches fetchAllBelongingTo action for shifts", async () => {
    const user = randomUser();
    const timesheet = randomTimesheet(user);
    const shift = randomShift(timesheet, DateTime.local());
    const store = seedStore([timesheet]);
    jest
      .spyOn(
        shiftActions as EntryActions<ShiftAttributes>,
        "fetchAllBelongingTo"
      )
      .mockImplementation(
        createMockAsyncThunk<ShiftAttributes>("shifts", [shift])
      );
    jest
      .spyOn(
        absenceActions as EntryActions<AbsenceAttributes>,
        "fetchAllBelongingTo"
      )
      .mockImplementation(
        createMockAsyncThunk<AbsenceAttributes>("absences", [])
      );

    await store.dispatch(fetchTimesheetEntries(timesheet));

    expect(shiftActions.fetchAllBelongingTo).toHaveBeenCalledWith(timesheet.id);
    expect(store.getState().shifts.entities.byID).toStrictEqual({
      [shift.id]: shift,
    });
  });

  it("dispatches fetchAllBelongingTo action for absences", async () => {
    const user = randomUser();
    const timesheet = randomTimesheet(user);
    const absence = randomAbsence(timesheet, DateTime.local());
    const store = seedStore([timesheet]);
    jest
      .spyOn(
        shiftActions as EntryActions<ShiftAttributes>,
        "fetchAllBelongingTo"
      )
      .mockImplementation(createMockAsyncThunk<ShiftAttributes>("shifts", []));
    jest
      .spyOn(
        absenceActions as EntryActions<AbsenceAttributes>,
        "fetchAllBelongingTo"
      )
      .mockImplementation(
        createMockAsyncThunk<AbsenceAttributes>("absences", [absence])
      );

    await store.dispatch(fetchTimesheetEntries(timesheet));

    expect(absenceActions.fetchAllBelongingTo).toHaveBeenCalledWith(
      timesheet.id
    );
    expect(store.getState().absences.entities.byID).toStrictEqual({
      [absence.id]: absence,
    });
  });
});
