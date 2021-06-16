import React from "react";
import { MemoryRouter, Route, Switch } from "react-router-dom";
import { act, render, screen } from "@testing-library/react";
import GuestRoute from "./GuestRoute";
import { randomUser } from "fixtures/random";
import { client } from "services/datastore";
import MockAdapter from "axios-mock-adapter";
import { ProvidersFixture } from "fixtures/context";
import { useAuth } from "context/auth";

// Mock the HTTP client used by the datastore.
const mockClient = new MockAdapter(client);

const Fixture: React.FC<{
  initialEntries: any[];
}> = ({ initialEntries }) => {
  const InnerFixture = () => {
    const { userInitialised } = useAuth();

    return userInitialised ? (
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
    ) : null;
  };

  return (
    <ProvidersFixture>
      <MemoryRouter initialEntries={initialEntries}>
        <InnerFixture />
      </MemoryRouter>
    </ProvidersFixture>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

test("renders guest route when not authenticated", async () => {
  mockClient.onGet("/user").reply(204);

  await act(async () => {
    render(<Fixture initialEntries={["/login"]} />);
  });

  screen.getByText(/user is not authenticated/i);
});

test("redirects to / when authenticated", async () => {
  const testUser = randomUser();
  mockClient.onGet("/user").reply(200, testUser);

  await act(async () => {
    render(<Fixture initialEntries={["/login"]} />);
  });

  screen.getByText(/user is authenticated/i);
});

test("redirects to referer path when authenticated", async () => {
  const testUser = randomUser();
  mockClient.onGet("/user").reply(200, testUser);

  await act(async () => {
    render(
      <Fixture
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
