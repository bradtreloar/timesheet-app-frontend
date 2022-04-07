import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { randomSettings, randomUser } from "fixtures/random";
import * as entityDatastore from "datastore/entity";
import { Provider } from "react-redux";
import { actions as settingsActions } from "settings/store/settings";
import SettingsPage from "./SettingsPage";
import createStore, { AppStore } from "store/createStore";
import { buildEntityState } from "store/entity";
import {
  getAttributes as getSettingAttributes,
  relationships as settingRelationships,
} from "settings/store/settings";
import { MessagesProvider } from "messages/context";
import { MockAuthProvider } from "fixtures/auth";

const user = randomUser();
const settings = randomSettings();

const Fixture: React.FC<{
  store: AppStore;
}> = ({ store }) => {
  return (
    <Provider store={store}>
      <MockAuthProvider
        value={{
          isAuthenticated: true,
          user: null,
        }}
      >
        <MessagesProvider>
          <MemoryRouter>
            <SettingsPage />
          </MemoryRouter>
        </MessagesProvider>
      </MockAuthProvider>
    </Provider>
  );
};

afterEach(() => {
  jest.resetAllMocks();
});

test("renders settings page", async () => {
  const store = createStore();
  store.dispatch(settingsActions.set(buildEntityState(settings)));

  await act(async () => {
    render(<Fixture store={store} />);
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/settings/i);
});

test("handles SettingsForm submission", async () => {
  const store = createStore();
  store.dispatch(settingsActions.set(buildEntityState(settings)));
  jest.spyOn(entityDatastore, "updateEntity").mockResolvedValue(settings[0]);

  await act(async () => {
    render(<Fixture store={store} />);
  });
  await act(async () => {
    userEvent.click(screen.getByText(/^save settings$/i));
  });

  expect(entityDatastore.updateEntity).toHaveBeenCalledWith(
    "settings",
    getSettingAttributes,
    settingRelationships,
    settings[0]
  );
  await screen.findByText(/settings updated/i);
});

test("displays error when settings update fails", async () => {
  const store = createStore();
  store.dispatch(settingsActions.set(buildEntityState(settings)));
  const errorMessage = "unable to save settings";
  jest
    .spyOn(entityDatastore, "updateEntity")
    .mockRejectedValue(new Error(errorMessage));

  await act(async () => {
    render(<Fixture store={store} />);
  });

  await act(async () => {
    userEvent.click(screen.getByText(/^save settings$/i));
  });
  screen.getByText(errorMessage);
});
