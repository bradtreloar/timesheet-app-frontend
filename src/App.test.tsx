import { act, render, screen } from "@testing-library/react";
import Randomstring from "randomstring";
import App from "App";
import { AuthContextValue } from "auth/context";
import { MockAuthProvider } from "fixtures/auth";
import { MessagesProvider } from "messages/context";
import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import createStore, { AppStore } from "store/createStore";

const Fixture: React.FC<{
  store: AppStore;
  authContextValue: Partial<AuthContextValue>;
  initialEntries?: string[];
}> = ({ authContextValue, store, initialEntries }) => {
  return (
    <Provider store={store}>
      <MockAuthProvider value={authContextValue}>
        <MessagesProvider>
          <MemoryRouter initialEntries={initialEntries || ["/"]}>
            <App />
          </MemoryRouter>
        </MessagesProvider>
      </MockAuthProvider>
    </Provider>
  );
};

it("renders loading screen when user not initialised", async () => {
  const store = createStore();

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          userInitialised: false,
        }}
        store={store}
      />
    );
  });

  screen.getByText(/loading/i);
});

it("renders error screen when auth error occurs", async () => {
  const store = createStore();
  const errorMessage = Randomstring.generate();

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          userInitialised: false,
          error: errorMessage,
        }}
        store={store}
      />
    );
  });

  screen.getByText(errorMessage);
});
