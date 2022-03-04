import React from "react";
import { MemoryRouter, Route, Switch } from "react-router-dom";
import { act, render, screen } from "@testing-library/react";
import ProtectedRoute from "./ProtectedRoute";
import { randomUser } from "fixtures/random";
import { AuthContextValue } from "auth/context";
import { MockAuthProvider } from "fixtures/auth";

const Fixture: React.FC<{
  authContextValue: Partial<AuthContextValue>;
}> = ({ authContextValue }) => (
  <MockAuthProvider value={authContextValue}>
    <MemoryRouter initialEntries={["/"]}>
      <Switch>
        <ProtectedRoute exact path="/">
          user is authenticated
        </ProtectedRoute>
        <Route exact path="/login">
          user is not authenticated
        </Route>
      </Switch>
    </MemoryRouter>
  </MockAuthProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
});

test("redirects to /login when not authenticated", async () => {
  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: false,
        }}
      />
    );
  });

  screen.getByText(/user is not authenticated/i);
});

test("renders protected route when authenticated", async () => {
  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
        }}
      />
    );
  });

  screen.getByText(/user is authenticated/i);
});
