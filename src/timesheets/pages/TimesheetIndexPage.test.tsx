import { act, render, screen } from "@testing-library/react";
import {
  randomCurrentUser,
  randomSettings,
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
  store.dispatch(timesheetActions.set(buildEntityState(timesheets)));

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
