import { act, render, screen } from "@testing-library/react";
import {
  randomCurrentUser,
  randomSettings,
  randomTimesheets,
  randomUser,
  randomUsers,
} from "fixtures/random";
import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router";
import { actions as userActions } from "users/store/users";
import UserIndexPage from "./UserIndexPage";
import createStore, { AppStore } from "store/createStore";
import { buildEntityState } from "store/entity";
import { MessagesProvider } from "messages/context";
import { MockAuthProvider } from "fixtures/auth";
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
          <MemoryRouter>
            <UserIndexPage />
          </MemoryRouter>
        </MessagesProvider>
      </MockAuthProvider>
    </Provider>
  );
};

test("renders user index page", async () => {
  const currentUser = randomCurrentUser();
  const users = randomUsers(3);
  const store = createStore();
  store.dispatch(userActions.set(buildEntityState(users)));

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          isAdmin: true,
          user: currentUser,
        }}
        store={store}
      />
    );
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/manage users/i);
  users.forEach((user) => {
    screen.getByText(user.attributes.name);
    screen.getByText(user.attributes.email);
  });
});
