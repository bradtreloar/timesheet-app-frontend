import React from "react";
import { MemoryRouter, Route, Switch } from "react-router-dom";
import { act, render, screen } from "@testing-library/react";
import GuestRoute from "./GuestRoute";
import { randomUser } from "fixtures/random";
import { AuthContextValue } from "auth/context";
import { MockAuthProvider } from "fixtures/auth";

const Fixture: React.FC<{
  initialEntries: any[];
  authContextValue: Partial<AuthContextValue>;
}> = ({ authContextValue, initialEntries }) => (
  <MockAuthProvider value={authContextValue}>
    <MemoryRouter initialEntries={initialEntries}>
      <Switch>
        <GuestRoute exact path="/login">
          user is not authenticated
        </GuestRoute>
        <Route exact path="/">
          user is authenticated
        </Route>
        <Route exact path="/referred-path">
          user is authenticated and on referred page
        </Route>
      </Switch>
    </MemoryRouter>
  </MockAuthProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
});

test("renders guest route when not authenticated", async () => {
  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: false,
        }}
        initialEntries={["/login"]}
      />
    );
  });

  screen.getByText(/user is not authenticated/i);
});

test("redirects to / when authenticated", async () => {
  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
        }}
        initialEntries={["/login"]}
      />
    );
  });

  screen.getByText(/user is authenticated/i);
});

test("redirects to referer path when authenticated", async () => {
  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
        }}
        initialEntries={[
          {
            pathname: "/login",
            state: {
              referer: {
                pathname: "/referred-path",
              },
            },
          },
        ]}
      />
    );
  });

  screen.getByText(/user is authenticated/i);
  screen.getByText(/and on referred page/i);
});
