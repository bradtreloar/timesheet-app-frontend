import React from "react";
import { act } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import { AuthProvider, useAuth } from "./context";
import * as datastore from "datastore";
import { randomPassword, randomCurrentUser } from "fixtures/random";
import Randomstring from "randomstring";
import { CurrentUser } from "./types";

jest.mock("datastore");

afterEach(() => {
  jest.resetAllMocks();
});

const wrapper: React.FC = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("unauthenticated user", () => {
  beforeEach(() => {
    jest.spyOn(datastore, "fetchCurrentUser").mockResolvedValue(null);
  });

  test("get unauthenticated status", async () => {
    const { result, waitForNextUpdate } = renderHook(async () => useAuth(), {
      wrapper,
    });
    await waitForNextUpdate();

    const state = await result.current;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
  });

  test("sets user on login", async () => {
    const user = randomCurrentUser();
    const password = randomPassword();
    const rememberLogin = true;
    jest.spyOn(datastore, "login").mockResolvedValue(user);

    const { result, waitForNextUpdate } = renderHook(async () => useAuth(), {
      wrapper,
    });
    await waitForNextUpdate();
    const state = await result.current;
    act(() => {
      state.login(user.email, password, rememberLogin);
    });
    await waitForNextUpdate();

    expect(datastore.login).toHaveBeenCalledWith(
      user.email,
      password,
      rememberLogin
    );
    const updatedState = await result.current;
    expect(updatedState.isAuthenticated).toBe(true);
    expect(updatedState.user).toBe(user);
  });

  test("throws error when login fails", async () => {
    const user = randomCurrentUser();
    const password = randomPassword();
    jest
      .spyOn(datastore, "login")
      .mockRejectedValue(new datastore.InvalidLoginException());

    const { result, waitForNextUpdate } = renderHook(async () => useAuth(), {
      wrapper,
    });
    await waitForNextUpdate();
    const state = await result.current;

    await expect(state.login(user.email, password, true)).rejects.toThrowError(
      "Unrecognised email or password."
    );
  });

  test("requests password reset", async () => {
    const user = randomCurrentUser();
    jest.spyOn(datastore, "forgotPassword").mockResolvedValue(undefined);

    const { result, waitForNextUpdate } = renderHook(async () => useAuth(), {
      wrapper,
    });
    await waitForNextUpdate();
    const state = await result.current;
    act(() => {
      state.forgotPassword(user.email);
    });

    expect(datastore.forgotPassword).toHaveBeenCalledWith(user.email);
  });

  test("resets password using token", async () => {
    const user = randomCurrentUser();
    const token = Randomstring.generate(50);
    const password = randomPassword();
    jest.spyOn(datastore, "resetPassword").mockResolvedValue(undefined);

    const { result, waitForNextUpdate } = renderHook(async () => useAuth(), {
      wrapper,
    });
    await waitForNextUpdate();
    const state = await result.current;
    act(() => {
      state.resetPassword(user.email, token, password);
    });

    expect(datastore.resetPassword).toHaveBeenCalledWith(
      user.email,
      token,
      password
    );
  });
});

describe("authenticated user", () => {
  let currentUser: CurrentUser;

  beforeEach(() => {
    currentUser = randomCurrentUser();
    jest.spyOn(datastore, "fetchCurrentUser").mockResolvedValue(currentUser);
  });

  test("get authenticated status", async () => {
    const { result, waitForNextUpdate } = renderHook(async () => useAuth(), {
      wrapper,
    });
    await waitForNextUpdate();

    const state = await result.current;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toBe(currentUser);
  });

  test("annulls user on logout", async () => {
    jest.spyOn(datastore, "logout").mockResolvedValue(undefined);

    const { result, waitForNextUpdate } = renderHook(async () => useAuth(), {
      wrapper,
    });
    await waitForNextUpdate();
    const state = await result.current;
    act(() => {
      state.logout();
    });
    await waitForNextUpdate();

    expect(datastore.logout).toHaveBeenCalledWith();
    const updatedState = await result.current;
    expect(updatedState.isAuthenticated).toBe(false);
    expect(updatedState.user).toBe(null);
  });

  test("annulls user when session has expired", async () => {
    jest.spyOn(datastore, "fetchCurrentUser").mockResolvedValue(null);

    const { result, waitForNextUpdate } = renderHook(async () => useAuth(), {
      wrapper,
    });
    await waitForNextUpdate();

    const state = await result.current;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
  });

  test("updates user", async () => {
    const updatedUser = Object.assign({}, currentUser, {
      name: randomCurrentUser().name,
    });
    jest.spyOn(datastore, "updateUser").mockResolvedValue(updatedUser);

    const { result, waitForNextUpdate } = renderHook(async () => useAuth(), {
      wrapper,
    });
    await waitForNextUpdate();
    const state = await result.current;
    act(() => {
      state.updateUser(updatedUser);
    });
    await waitForNextUpdate();

    const updatedState = await result.current;
    expect(updatedState.user).toBe(updatedUser);
  });
});

describe("admin user", () => {
  let currentUser: CurrentUser;

  beforeEach(() => {
    currentUser = randomCurrentUser();
    currentUser.isAdmin = true;
    jest.spyOn(datastore, "fetchCurrentUser").mockResolvedValue(currentUser);
  });

  test("gets admin status", async () => {
    const { result, waitForNextUpdate } = renderHook(async () => useAuth(), {
      wrapper,
    });
    await waitForNextUpdate();

    const state = await result.current;
    expect(state.isAuthenticated).toBe(true);
    expect(state.isAdmin).toBe(true);
    expect(state.user).toBe(currentUser);
  });
});
