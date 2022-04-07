import { client, jsonAPIClient } from "datastore/clients";
import MockAdapter from "axios-mock-adapter";
import { randomPassword, randomToken, randomUser } from "fixtures/random";
import {
  fetchCurrentUser,
  forgotPassword,
  InvalidLoginException,
  InvalidPasswordException,
  login,
  logout,
  resetPassword,
  setPassword,
  UnauthorizedForgotPasswordException,
  UnauthorizedLogoutException,
  UnauthorizedResetPasswordException,
} from "./auth";

const mockClient = new MockAdapter(client);
const mockJsonAPIClient = new MockAdapter(jsonAPIClient);

beforeEach(() => {
  mockClient.onGet("/csrf-cookie").reply(204);
});

afterEach(() => {
  jest.resetAllMocks();
  mockClient.reset();
  mockJsonAPIClient.reset();
});

describe("login", () => {
  test("requests CSRF token", async () => {
    const user = randomUser();
    const password = randomPassword();
    const remember = true;
    mockClient.onPost("/login").reply(200, user);

    await login(user.attributes.email, password, remember);

    const history = mockClient.history;
    expect(history.get.length).toBe(1);
    expect(history.get[0].url).toBe("/csrf-cookie");
  });

  test("sends username and password to API", async () => {
    const user = randomUser();
    const password = randomPassword();
    const remember = true;
    mockClient.onPost("/login").reply(200, user);

    await login(user.attributes.email, password, remember);

    const history = mockClient.history;
    expect(history.post.length).toBe(1);
    expect(history.post[0].url).toBe("/login");
    expect(JSON.parse(history.post[0].data)).toStrictEqual({
      email: user.attributes.email,
      password,
      remember,
    });
  });

  test("returns user entity on success", async () => {
    const user = randomUser();
    const password = randomPassword();
    const remember = true;
    mockClient.onPost("/login").reply(200, user);

    const result = await login(user.attributes.email, password, remember);

    expect(result).toStrictEqual(user);
  });

  test("throws exception on invalid request", async () => {
    const user = randomUser();
    const password = randomPassword();
    const remember = true;
    mockClient.onPost("/login").reply(422);

    await expect(
      login(user.attributes.email, password, remember)
    ).rejects.toThrow(InvalidLoginException);
  });
});

describe("logout", () => {
  test("requests CSRF token", async () => {
    mockClient.onPost("/logout").reply(204);

    await logout();

    const history = mockClient.history;
    expect(history.get.length).toBe(1);
    expect(history.get[0].url).toBe("/csrf-cookie");
  });

  test("sends nothing to API", async () => {
    mockClient.onPost("/logout").reply(204);

    await logout();

    const history = mockClient.history;
    expect(history.post.length).toBe(1);
    expect(history.post[0].data).toBeUndefined();
  });

  test("returns nothing on success", async () => {
    mockClient.onPost("/logout").reply(204);

    const result = await logout();

    expect(result).toBeUndefined();
  });

  test("throws exception on invalid request", async () => {
    mockClient.onPost("/logout").reply(403);

    await expect(logout()).rejects.toThrow(UnauthorizedLogoutException);
  });
});

describe("forgotPassword", () => {
  test("requests CSRF token", async () => {
    const user = randomUser();
    mockClient.onPost("/forgot-password").reply(204);

    await forgotPassword(user.attributes.email);

    const history = mockClient.history;
    expect(history.get.length).toBe(1);
    expect(history.get[0].url).toBe("/csrf-cookie");
  });

  test("sends email to API", async () => {
    const user = randomUser();
    mockClient.onPost("/forgot-password").reply(204);

    await forgotPassword(user.attributes.email);

    const history = mockClient.history;
    expect(history.post.length).toBe(1);
    expect(JSON.parse(history.post[0].data)).toStrictEqual({
      email: user.attributes.email,
    });
  });

  test("returns nothing on success", async () => {
    const user = randomUser();
    mockClient.onPost("/forgot-password").reply(204);

    const result = await forgotPassword(user.attributes.email);

    expect(result).toBeUndefined();
  });

  test("throws exception on invalid request", async () => {
    const user = randomUser();
    mockClient.onPost("/forgot-password").reply(403);

    await expect(forgotPassword(user.attributes.email)).rejects.toThrow(
      UnauthorizedForgotPasswordException
    );
  });
});

describe("setPassword", () => {
  test("requests CSRF token", async () => {
    const password = randomPassword();
    mockClient.onPost("/set-password").reply(204);

    await setPassword(password);

    const history = mockClient.history;
    expect(history.get.length).toBe(1);
    expect(history.get[0].url).toBe("/csrf-cookie");
  });

  test("sends password to API", async () => {
    const password = randomPassword();
    mockClient.onPost("/set-password").reply(204);

    await setPassword(password);

    const history = mockClient.history;
    expect(history.post.length).toBe(1);
    expect(JSON.parse(history.post[0].data)).toStrictEqual({
      password,
    });
  });

  test("returns nothing on success", async () => {
    const password = randomPassword();
    mockClient.onPost("/set-password").reply(204);

    const result = await setPassword(password);

    expect(result).toBeUndefined();
  });

  test("throws exception on invalid request", async () => {
    const password = randomPassword();
    mockClient.onPost("/set-password").reply(422);

    await expect(setPassword(password)).rejects.toThrow(
      InvalidPasswordException
    );
  });
});

describe("resetPassword", () => {
  test("requests CSRF token", async () => {
    const user = randomUser();
    const password = randomPassword();
    const token = randomToken();
    mockClient.onPost("/reset-password").reply(204);

    await resetPassword(user.attributes.email, token, password);

    const history = mockClient.history;
    expect(history.get.length).toBe(1);
    expect(history.get[0].url).toBe("/csrf-cookie");
  });

  test("sends email, password and token to API", async () => {
    const user = randomUser();
    const password = randomPassword();
    const token = randomToken();
    mockClient.onPost("/reset-password").reply(204);

    await resetPassword(user.attributes.email, token, password);

    const history = mockClient.history;
    expect(history.post.length).toBe(1);
    expect(JSON.parse(history.post[0].data)).toStrictEqual({
      email: user.attributes.email,
      password,
      token,
    });
  });

  test("returns nothing on success", async () => {
    const user = randomUser();
    const password = randomPassword();
    const token = randomToken();
    mockClient.onPost("/reset-password").reply(204);

    const result = await resetPassword(user.attributes.email, token, password);

    expect(result).toBeUndefined();
  });

  test("throws exception on invalid request", async () => {
    const user = randomUser();
    const password = randomPassword();
    const token = randomToken();
    mockClient.onPost("/reset-password").reply(403);

    await expect(
      resetPassword(user.attributes.email, password, token)
    ).rejects.toThrow(UnauthorizedResetPasswordException);
  });
});

describe("fetchCurrentUser", () => {
  test("requests authenticated user", async () => {
    const user = randomUser();
    mockClient.onGet("/user").reply(200, user);

    await fetchCurrentUser();

    const history = mockClient.history;
    expect(history.get.length).toBe(1);
    expect(history.get[0].url).toBe("/user");
  });

  test("returns user when response contains user", async () => {
    const user = randomUser();
    mockClient.onGet("/user").reply(200, user);

    const result = await fetchCurrentUser();

    expect(result).toStrictEqual(user);
  });

  test("returns null when response is empty", async () => {
    mockClient.onGet("/user").reply(204);

    const result2 = await fetchCurrentUser();

    expect(result2).toBeNull();
  });
});
