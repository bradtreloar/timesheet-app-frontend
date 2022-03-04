import React from "react";
import { MemoryRouter, Route } from "react-router-dom";
import { act, render, screen } from "@testing-library/react";
import { randomUser } from "fixtures/random";
import AdminRoute from "./AdminRoute";
import { AuthContextValue } from "auth/context";
import { MockAuthProvider } from "fixtures/auth";
import { MessagesProvider } from "messages/context";

const Fixture: React.FC<{
  authContextValue: Partial<AuthContextValue>;
}> = ({ authContextValue }) => (
  <MockAuthProvider value={authContextValue}>
    <MessagesProvider>
      <MemoryRouter initialEntries={["/"]}>
        <AdminRoute exact path="/">
          user is admin
        </AdminRoute>
        <Route exact path="/login">
          user is not authenticated
        </Route>
      </MemoryRouter>
    </MessagesProvider>
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

test("renders admin route when authenticated as admin", async () => {
  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          isAdmin: true,
        }}
      />
    );
  });

  screen.getByText(/user is admin/i);
});

test("renders access denied route when authenticated but not admin", async () => {
  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          isAdmin: false,
        }}
      />
    );
  });

  screen.getByText(/403/i);
});
