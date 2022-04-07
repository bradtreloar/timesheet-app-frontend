import React from "react";
import { act } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import { AuthProvider, useAuth } from "./context";
import * as auth from "datastore/auth";
import { randomPassword, randomCurrentUser } from "fixtures/random";
import Randomstring from "randomstring";
import { CurrentUser } from "./types";

jest.mock("datastore/auth");

afterEach(() => {
  jest.resetAllMocks();
});

const wrapper: React.FC = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("unauthenticated user", () => {
  beforeEach(() => {
    jest.spyOn(auth, "fetchCurrentUser").mockResolvedValue(null);
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
    jest.spyOn(auth, "login").mockResolvedValue(user);

    const { result, waitForNextUpdate } = renderHook(async () => useAuth(), {
      wrapper,
    });
    await waitForNextUpdate();
    const state = await result.current;
    act(() => {
      state.login(user.email, password, rememberLogin);
    });
    await waitForNextUpdate();

    expect(auth.login).toHaveBeenCalledWith(
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
      .spyOn(auth, "login")
      .mockRejectedValue(new auth.InvalidLoginException());

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
    jest.spyOn(auth, "forgotPassword").mockResolvedValue(undefined);

    const { result, waitForNextUpdate } = renderHook(async () => useAuth(), {
      wrapper,
    });
    await waitForNextUpdate();
    const state = await result.current;
    act(() => {
      state.forgotPassword(user.email);
    });

    expect(auth.forgotPassword).toHaveBeenCalledWith(user.email);
  });

  test("resets password using token", async () => {
    const user = randomCurrentUser();
    const token = Randomstring.generate(50);
    const password = randomPassword();
    jest.spyOn(auth, "resetPassword").mockResolvedValue(undefined);

    const { result, waitForNextUpdate } = renderHook(async () => useAuth(), {
      wrapper,
    });
    await waitForNextUpdate();
    const state = await result.current;
    act(() => {
      state.resetPassword(user.email, token, password);
    });

    expect(auth.resetPassword).toHaveBeenCalledWith(
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
    jest.spyOn(auth, "fetchCurrentUser").mockResolvedValue(currentUser);
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
    jest.spyOn(auth, "logout").mockResolvedValue(undefined);

    const { result, waitForNextUpdate } = renderHook(async () => useAuth(), {
      wrapper,
    });
    await waitForNextUpdate();
    const state = await result.current;
    act(() => {
      state.logout();
    });
    await waitForNextUpdate();

    expect(auth.logout).toHaveBeenCalledWith();
    const updatedState = await result.current;
    expect(updatedState.isAuthenticated).toBe(false);
    expect(updatedState.user).toBe(null);
  });

  test("annulls user when session has expired", async () => {
    jest.spyOn(auth, "fetchCurrentUser").mockResolvedValue(null);

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
    jest.spyOn(auth, "updateUser").mockResolvedValue(updatedUser);

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
    jest.spyOn(auth, "fetchCurrentUser").mockResolvedValue(currentUser);
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
