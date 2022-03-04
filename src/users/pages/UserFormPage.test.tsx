import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
import faker from "faker";
import * as datastore from "datastore";
import UserFormPage from "./UserFormPage";
import createStore, { AppStore } from "store/createStore";
import { actions as userActions } from "users/store/users";
import { buildEntityState } from "store/entity";
import { values } from "lodash";
import { MockAuthProvider } from "fixtures/auth";
import { MessagesProvider } from "messages/context";
import UserDeletePage from "./UserDeletePage";
import { AuthContextValue } from "auth/context";

jest.mock("datastore");

const Fixture: React.FC<{
  authContextValue: Partial<AuthContextValue>;
  store: AppStore;
  initialEntries?: string[];
  route?: string;
}> = ({ authContextValue, store, initialEntries, route }) => {
  return (
    <Provider store={store}>
      <MockAuthProvider value={authContextValue}>
        <MessagesProvider>
          <MemoryRouter initialEntries={initialEntries}>
            {route !== undefined ? (
              <Route path={route}>
                <UserFormPage />
              </Route>
            ) : (
              <UserFormPage />
            )}
          </MemoryRouter>
        </MessagesProvider>
      </MockAuthProvider>
    </Provider>
  );
};

describe("new user form", () => {
  test("renders", async () => {
    const currentUser = randomCurrentUser();
    const store = createStore();

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

    expect(screen.getByRole("heading")).toHaveTextContent(/new user/i);
    screen.getByLabelText(/name/i);
    screen.getByLabelText(/email/i);
    screen.getByLabelText(/administrator/i);
  });

  test("handles form submit", async () => {
    const currentUser = randomCurrentUser();
    const user = randomUser();
    const store = createStore();
    jest.spyOn(datastore, "createEntity").mockResolvedValue(user);

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

    userEvent.type(screen.getByLabelText(/name/i), user.attributes.name);
    userEvent.type(screen.getByLabelText(/email/i), user.attributes.email);
    await act(async () => {
      userEvent.click(screen.getByText(/create user/i));
    });

    const { entities } = store.getState().users;
    expect(values(entities.byID)).toStrictEqual([user]);
  });
});

describe("existing user form", () => {
  test("renders", async () => {
    const currentUser = randomCurrentUser();
    const user = randomUser();
    const store = createStore();
    store.dispatch(userActions.set(buildEntityState([user])));

    await act(async () => {
      render(
        <Fixture
          authContextValue={{
            isAuthenticated: true,
            isAdmin: true,
            user: currentUser,
          }}
          store={store}
          initialEntries={[`/users/${user.id}`]}
          route="/users/:id"
        />
      );
    });

    expect(screen.getByRole("heading")).toHaveTextContent(/edit user/i);
    screen.getByLabelText(/name/i);
    screen.getByLabelText(/email/i);
    screen.getByLabelText(/administrator/i);
  });

  test("handles form submit", async () => {
    const currentUser = randomCurrentUser();
    const user = randomUser();
    const updatedUser = Object.assign({}, user, {
      name: faker.name.findName(),
      email: faker.internet.email(),
    });
    const store = createStore();
    store.dispatch(userActions.set(buildEntityState([user])));
    jest.spyOn(datastore, "updateEntity").mockResolvedValue(updatedUser);

    await act(async () => {
      render(
        <Fixture
          authContextValue={{
            isAuthenticated: true,
            isAdmin: true,
            user: currentUser,
          }}
          store={store}
          initialEntries={[`/users/${user.id}`]}
          route="/users/:id"
        />
      );
    });

    expect(screen.getByRole("heading")).toHaveTextContent(/edit user/i);
    userEvent.clear(screen.getByLabelText(/name/i));
    userEvent.type(screen.getByLabelText(/name/i), updatedUser.name);
    userEvent.clear(screen.getByLabelText(/email/i));
    userEvent.type(screen.getByLabelText(/email/i), updatedUser.email);
    await act(async () => {
      userEvent.click(screen.getByText(/save/i));
    });

    const { entities } = store.getState().users;
    expect(entities.byID).toStrictEqual({
      [updatedUser.id]: updatedUser,
    });
  });
});
