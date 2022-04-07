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
import * as entityDatastore from "datastore/entity";
import { actions as userActions } from "users/store/users";
import UserDeletePage from "./UserDeletePage";
import createStore, { AppStore } from "store/createStore";
import { buildEntityState } from "store/entity";
import { AuthContextValue } from "auth/context";
import { MockAuthProvider } from "fixtures/auth";
import { MessagesProvider } from "messages/context";

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
            <Route path="/user/:id/delete">
              <UserDeletePage />
            </Route>
          </MemoryRouter>
        </MessagesProvider>
      </MockAuthProvider>
    </Provider>
  );
};

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
        initialEntries={[`/user/${user.id}/delete`]}
      />
    );
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/delete user/i);
});

test("handles clicking delete button", async () => {
  const currentUser = randomCurrentUser();
  const user = randomUser();
  const store = createStore();
  store.dispatch(userActions.set(buildEntityState([user])));
  jest.spyOn(entityDatastore, "deleteEntity").mockResolvedValue(user);

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          isAdmin: true,
          user: currentUser,
        }}
        store={store}
        initialEntries={[`/user/${user.id}/delete`]}
      />
    );
  });

  await act(async () => {
    screen.getAllByText(/delete user/i).forEach((element) => {
      if (element.getAttribute("type") === "button") {
        userEvent.click(element);
      }
    });
  });

  const { entities } = store.getState().users;
  expect(entities.allIDs).toStrictEqual([]);
  expect(entities.byID).toStrictEqual({});
});
