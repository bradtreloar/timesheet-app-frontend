import React from "react";
import { MemoryRouter, Route, Switch } from "react-router-dom";
import { act, render, screen } from "@testing-library/react";
import ProtectedRoute from "./ProtectedRoute";
import { randomUser } from "fixtures/random";
import { client } from "services/datastore";
import MockAdapter from "axios-mock-adapter";
import { ProvidersFixture } from "fixtures/context";
import { useAuth } from "context/auth";

// Mock the HTTP client used by the datastore.
const mockClient = new MockAdapter(client);

const Fixture: React.FC = () => {
  const InnerFixture = () => {
    const { userInitialised } = useAuth();

    return userInitialised ? (
      <Switch>
        <ProtectedRoute exact path="/">
          user is authenticated
        </ProtectedRoute>
        <Route exact path="/login">
          user is not authenticated
        </Route>
      </Switch>
    ) : null;
  };

  return (
    <ProvidersFixture>
      <MemoryRouter initialEntries={["/"]}>
        <InnerFixture />
      </MemoryRouter>
    </ProvidersFixture>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

test("redirects to /login when not authenticated", async () => {
  mockClient.onGet("/user").reply(204);
  await act(async () => {
    render(<Fixture />);
  });
  screen.getByText(/user is not authenticated/i);
});

test("renders protected route when authenticated", async () => {
  const testUser = randomUser();
  mockClient.onGet("/user").reply(200, testUser);
  await act(async () => {
    render(<Fixture />);
  });
  screen.getByText(/user is authenticated/i);
});
