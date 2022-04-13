import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { randomCurrentUser, randomSettings, randomUser } from "fixtures/random";
import * as entityDatastore from "datastore/entity";
import { Provider } from "react-redux";
import { actions as settingsActions } from "settings/store/settings";
import SettingsPage from "./SettingsPage";
import createStore, { AppStore } from "store/createStore";
import { buildEntityState } from "store/entity";
import {
  getAttributes as getSettingAttributes,
  relationships as settingRelationships,
  actions as settingActions,
} from "settings/store/settings";
import { MessagesProvider } from "messages/context";
import { MockAuthProvider } from "fixtures/auth";
import { createAsyncThunk } from "@reduxjs/toolkit";

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

it("renders settings page", async () => {
  const settings = randomSettings();
  const store = createStore();
  store.dispatch(settingsActions.set(buildEntityState(settings)));
  jest
    .spyOn(settingActions, "fetchAll")
    .mockImplementation(
      createAsyncThunk("settings/fetchAll", () => Promise.resolve(settings))
    );

  await act(async () => {
    render(<Fixture store={store} />);
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/settings/i);
});

it("handles SettingsForm submission", async () => {
  const settings = randomSettings();
  const store = createStore();
  store.dispatch(settingsActions.set(buildEntityState(settings)));
  jest
    .spyOn(settingActions, "fetchAll")
    .mockImplementation(
      createAsyncThunk("settings/fetchAll", () => Promise.resolve(settings))
    );
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

it("displays error when settings update fails", async () => {
  const settings = randomSettings();
  const store = createStore();
  store.dispatch(settingsActions.set(buildEntityState(settings)));
  const errorMessage = "unable to save settings";
  jest
    .spyOn(settingActions, "fetchAll")
    .mockImplementation(
      createAsyncThunk("settings/fetchAll", () => Promise.resolve(settings))
    );
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

it("fetches settings on mount", async () => {
  const settings = randomSettings();
  const store = createStore();
  store.dispatch(settingActions.set(buildEntityState(settings)));
  jest
    .spyOn(settingActions, "fetchAll")
    .mockImplementation(
      createAsyncThunk("settings/fetchAll", () => Promise.resolve(settings))
    );

  await act(async () => {
    render(<Fixture store={store} />);
  });

  expect(settingActions.fetchAll).toHaveBeenCalled();
  const { entities } = store.getState().settings;
  expect(entities).toStrictEqual(buildEntityState(settings).entities);
});
