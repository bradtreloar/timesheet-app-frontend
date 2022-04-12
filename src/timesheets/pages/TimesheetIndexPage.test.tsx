import { act, render, screen } from "@testing-library/react";
import {
  randomCurrentUser,
  randomSettings,
  randomTimesheet,
  randomTimesheets,
} from "fixtures/random";
import { DateTime } from "luxon";
import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router";
import { actions as settingsActions } from "settings/store/settings";
import { actions as timesheetActions } from "timesheets/store/timesheets";
import TimesheetIndexPage from "./TimesheetIndexPage";
import createStore, { AppStore } from "store/createStore";
import { buildEntityState } from "store/entity";
import { AuthContextValue } from "auth/context";
import { MockAuthProvider } from "fixtures/auth";
import { MessagesProvider } from "messages/context";
import { createAsyncThunk } from "@reduxjs/toolkit";

const Fixture: React.FC<{
  authContextValue: Partial<AuthContextValue>;
  store: AppStore;
}> = ({ authContextValue, store }) => {
  return (
    <Provider store={store}>
      <MockAuthProvider value={authContextValue}>
        <MessagesProvider>
          <MemoryRouter>
            <Route exact path="/">
              <TimesheetIndexPage />
            </Route>
          </MemoryRouter>
        </MessagesProvider>
      </MockAuthProvider>
    </Provider>
  );
};

test("renders timesheet index page", async () => {
  const user = randomCurrentUser();
  const timesheets = randomTimesheets(user, 3);
  const settings = randomSettings();
  const store = createStore();
  store.dispatch(settingsActions.set(buildEntityState(settings)));
  jest
    .spyOn(timesheetActions, "fetchAll")
    .mockImplementation(
      createAsyncThunk("timesheets/fetchAll", () => Promise.resolve(timesheets))
    );

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          user,
        }}
        store={store}
      />
    );
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/timesheets/i);
  timesheets.forEach((timesheet) => {
    screen.getAllByText(
      DateTime.fromISO(timesheet.created as string).toLocaleString(
        DateTime.DATE_SHORT
      )
    );
  });
});

it("fetches timesheets on mount when none in store", async () => {
  const user = randomCurrentUser();
  const timesheet = randomTimesheet(user);
  const store = createStore();
  jest
    .spyOn(timesheetActions, "fetchAll")
    .mockImplementation(
      createAsyncThunk("timesheets/fetchAll", () =>
        Promise.resolve([timesheet])
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
      />
    );
  });

  expect(timesheetActions.fetchAll).toHaveBeenCalled();
  expect(store.getState().timesheets.entities).toStrictEqual(
    buildEntityState([timesheet]).entities
  );
});
