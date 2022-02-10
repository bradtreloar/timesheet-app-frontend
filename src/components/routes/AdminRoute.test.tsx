import React from "react";
import { MemoryRouter, Route } from "react-router-dom";
import { act, render, screen } from "@testing-library/react";
import { randomUser } from "fixtures/random";
import { client } from "datastore";
import MockAdapter from "axios-mock-adapter";
import AdminRoute from "./AdminRoute";
import { ProvidersFixture } from "fixtures/context";

// Mock the HTTP client used by the datastore.
const mockClient = new MockAdapter(client);

const Fixture = () => (
  <ProvidersFixture>
    <MemoryRouter initialEntries={["/"]}>
      <AdminRoute exact path="/">
        user is admin
      </AdminRoute>
      <Route exact path="/login">
        user is not authenticated
      </Route>
    </MemoryRouter>
  </ProvidersFixture>
);

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

test("renders admin route when authenticated as admin", async () => {
  const testUser = randomUser({
    isAdmin: true,
  });
  mockClient.onGet("/user").reply(200, testUser);
  await act(async () => {
    render(<Fixture />);
  });
  screen.getByText(/user is admin/i);
});

test("renders access denied route when authenticated but not admin", async () => {
  const testUser = randomUser();
  mockClient.onGet("/user").reply(200, testUser);
  await act(async () => {
    render(<Fixture />);
  });
  screen.getByText(/403/i);
});
