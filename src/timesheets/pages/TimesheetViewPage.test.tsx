import React from "react";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";
import { randomCurrentUser, randomTimesheet } from "fixtures/random";
import TimesheetViewPage from "./TimesheetViewPage";
import { Provider } from "react-redux";
import { actions as timesheetActions } from "timesheets/store/timesheets";
import createStore, { AppStore } from "store/createStore";
import { buildEntityState } from "store/entity";
import { mockAuthContext, MockAuthProvider } from "fixtures/auth";
import { MessagesProvider } from "messages/context";
import { AuthContextValue } from "auth/context";

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

test("renders timesheet view page", async () => {
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
