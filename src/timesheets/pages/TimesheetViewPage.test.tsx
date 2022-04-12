import React from "react";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";
import {
  randomAbsence,
  randomCurrentUser,
  randomID,
  randomShift,
  randomTimesheet,
} from "fixtures/random";
import TimesheetViewPage from "./TimesheetViewPage";
import { Provider } from "react-redux";
import { actions as timesheetActions } from "timesheets/store/timesheets";
import { actions as shiftActions } from "timesheets/store/shifts";
import { actions as absenceActions } from "timesheets/store/absences";
import createStore, { AppStore } from "store/createStore";
import { buildEntityState } from "store/entity";
import { mockAuthContext, MockAuthProvider } from "fixtures/auth";
import { MessagesProvider } from "messages/context";
import { AuthContextValue } from "auth/context";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { DateTime } from "luxon";
import {
  EntityNotFoundException,
  UnauthorizedEntityRequestException,
} from "datastore/entity";

const Fixture: React.FC<{
  authContextValue: Partial<AuthContextValue>;
  store: AppStore;
  initialEntries?: string[];
}> = ({ authContextValue, store, initialEntries }) => {
  return (
    <Provider store={store}>
      <MockAuthProvider value={authContextValue}>
        <MessagesProvider>
          <MemoryRouter initialEntries={initialEntries}>
            <Route path="/timesheet/:id">
              <TimesheetViewPage />
            </Route>
          </MemoryRouter>
        </MessagesProvider>
      </MockAuthProvider>
    </Provider>
  );
};

it("renders timesheet view page", async () => {
  const user = randomCurrentUser();
  const timesheet = randomTimesheet(user);
  const store = createStore();
  store.dispatch(timesheetActions.set(buildEntityState([timesheet])));

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          user,
        }}
        store={store}
        initialEntries={[`/timesheet/${timesheet.id}`]}
      />
    );
  });

  expect(screen.getAllByRole("heading")[0]).toHaveTextContent(/timesheet/i);
});

it("fetches timesheet on mount when not in store", async () => {
  const user = randomCurrentUser();
  const timesheet = randomTimesheet(user);
  const store = createStore();
  jest
    .spyOn(timesheetActions, "fetchOne")
    .mockImplementation(
      createAsyncThunk("timesheets/fetchOne", () => Promise.resolve(timesheet))
    );

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          user,
        }}
        store={store}
        initialEntries={[`/timesheet/${timesheet.id}`]}
      />
    );
  });

  expect(timesheetActions.fetchOne).toHaveBeenCalledWith(timesheet.id);
  expect(store.getState().timesheets.entities).toStrictEqual(
    buildEntityState([timesheet]).entities
  );
});

it("fetches timesheet shifts on mount when not in store", async () => {
  const user = randomCurrentUser();
  const timesheet = randomTimesheet(user);
  const date = DateTime.local();
  const shift = randomShift(timesheet, date);
  const store = createStore();
  timesheet.relationships.shifts = [shift.id];
  store.dispatch(timesheetActions.set(buildEntityState([timesheet])));
  jest
    .spyOn(shiftActions, "fetchAllBelongingTo")
    .mockImplementation(
      createAsyncThunk("shifts/fetchAllBelongingTo", () =>
        Promise.resolve([shift])
      )
    );

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          user,
        }}
        store={store}
        initialEntries={[`/timesheet/${timesheet.id}`]}
      />
    );
  });

  expect(shiftActions.fetchAllBelongingTo).toHaveBeenCalledWith(timesheet.id);
  expect(store.getState().shifts.entities).toStrictEqual(
    buildEntityState([shift]).entities
  );
});

it("fetches timesheet absences on mount when not in store", async () => {
  const user = randomCurrentUser();
  const timesheet = randomTimesheet(user);
  const date = DateTime.local();
  const absence = randomAbsence(timesheet, date);
  const store = createStore();
  timesheet.relationships.absences = [absence.id];
  store.dispatch(timesheetActions.set(buildEntityState([timesheet])));
  jest
    .spyOn(absenceActions, "fetchAllBelongingTo")
    .mockImplementation(
      createAsyncThunk("absences/fetchAllBelongingTo", () =>
        Promise.resolve([absence])
      )
    );

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          user,
        }}
        store={store}
        initialEntries={[`/timesheet/${timesheet.id}`]}
      />
    );
  });

  expect(absenceActions.fetchAllBelongingTo).toHaveBeenCalledWith(timesheet.id);
  expect(store.getState().absences.entities).toStrictEqual(
    buildEntityState([absence]).entities
  );
});

it("renders NotFoundPage when timesheet cannot be found", async () => {
  const user = randomCurrentUser();
  const store = createStore();
  const id = randomID();
  jest.spyOn(timesheetActions, "fetchOne").mockImplementation(
    createAsyncThunk("timesheet/fetchOne", () => {
      throw new EntityNotFoundException("timesheets", id);
    })
  );

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          user,
        }}
        store={store}
        initialEntries={[`/timesheet/${id}`]}
      />
    );
  });

  expect(timesheetActions.fetchOne).toHaveBeenCalledWith(id);
  screen.getByTestId("not-found-message");
});

it("renders NotFoundPage when timesheet access denied", async () => {
  const user = randomCurrentUser();
  const store = createStore();
  const id = randomID();
  jest.spyOn(timesheetActions, "fetchOne").mockImplementation(
    createAsyncThunk("timesheet/fetchOne", () => {
      throw new UnauthorizedEntityRequestException("timesheets", id);
    })
  );

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          user,
        }}
        store={store}
        initialEntries={[`/timesheet/${id}`]}
      />
    );
  });

  expect(timesheetActions.fetchOne).toHaveBeenCalledWith(id);
  screen.getByTestId("not-found-message");
});
