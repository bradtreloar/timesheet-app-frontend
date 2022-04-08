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
  EntryKeys,
  Shift,
  ShiftAttributes,
  Timesheet,
} from "timesheets/types";
import { AsyncThunk, createAsyncThunk } from "@reduxjs/toolkit";
import { DateTime } from "luxon";
import { Entity, EntityAttributes, EntityKeys } from "store/types";

const seedStore = (timesheets: Timesheet[]) => {
  const store = createStore();
  store.dispatch(timesheetActions.set(buildEntityState(timesheets)));
  return store;
};

const createMockAsyncThunk = <A extends EntityAttributes, K extends EntityKeys>(
  entityType: string,
  payload: Entity<A, K>[]
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
    jest.spyOn(shiftActions, "fetchAllBelongingTo").mockImplementation(
      createMockAsyncThunk<ShiftAttributes, EntryKeys>("shifts", [shift])
    );
    jest
      .spyOn(absenceActions, "fetchAllBelongingTo")
      .mockImplementation(
        createMockAsyncThunk<AbsenceAttributes, EntryKeys>("absences", [])
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
      .spyOn(shiftActions, "fetchAllBelongingTo")
      .mockImplementation(
        createMockAsyncThunk<ShiftAttributes, EntryKeys>("shifts", [])
      );
    jest.spyOn(absenceActions, "fetchAllBelongingTo").mockImplementation(
      createMockAsyncThunk<AbsenceAttributes, EntryKeys>("absences", [absence])
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
