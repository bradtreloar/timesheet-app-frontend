import React, { useState } from "react";
import { render, act } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./auth";
import { client } from "datastore";
import { randomPassword, randomUser } from "fixtures/random";
import randomstring from "randomstring";
import MockAdapter from "axios-mock-adapter";

// Mock the HTTP client used by the datastore.
const mockClient = new MockAdapter(client);

const testUser = randomUser();
const testAdminUser = randomUser({
  isAdmin: true,
});
const testPassword = randomPassword();
const testToken = randomstring.generate(50);

const Fixture = () => {
  const { isAuthenticated, isAdmin, login, logout, resetPassword } = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (error) {
    return <div data-testid="error">{error}</div>;
  }

  return isAuthenticated ? (
    <>
      <div>User is logged in</div>
      {isAdmin && <div>User is admin.</div>}
      {message && <div>{message}</div>}
      <button
        onClick={async () => {
          await logout();
        }}
      >
        Log out
      </button>
    </>
  ) : (
    <>
      <div>User is not logged in</div>
      {message && <div>{message}</div>}
      <button
        onClick={async () => {
          try {
            await login(testUser.email, testPassword, true);
          } catch (error) {
            setError(error.message);
          }
        }}
      >
        Log in
      </button>
      <button
        onClick={async () => {
          await resetPassword(testUser.email, testToken, testPassword);
          setMessage("password was reset");
        }}
      >
        Save Password
      </button>
    </>
  );
};

beforeEach(() => {
  mockClient.onGet("/csrf-cookie").reply(204);
});

afterEach(() => {
  mockClient.reset();
});

describe("unauthenticated user", () => {
  beforeEach(() => {
    mockClient.onGet("/user").reply(204);
  });

  test("user is unauthenticated", async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <Fixture />
        </AuthProvider>
      );
    });

    screen.getByText(/User is not logged in/);
  });

  test("user logs in successfully", async () => {
    mockClient.onPost("/login").reply(200, testUser);

    await act(async () => {
      render(
        <AuthProvider>
          <Fixture />
        </AuthProvider>
      );
    });

    await act(async () => {
      userEvent.click(screen.getByText(/Log in/));
    });
    screen.getByText(/User is logged in/);
  });

  test("invalid user fails to log in", async () => {
    mockClient.onPost("/login").reply(422);

    await act(async () => {
      render(
        <AuthProvider>
          <Fixture />
        </AuthProvider>
      );
    });

    await act(async () => {
      userEvent.click(screen.getByText(/Log in/));
    });
    screen.getByText(/unrecognized email or password/i);
  });

  test("requests password reset", async () => {
    mockClient.onPost("/forgot-password").reply(204);

    const Fixture: React.FC = () => {
      const { forgotPassword } = useAuth();
      const [message, setMessage] = useState("");

      return (
        <>
          {message && <div>{message}</div>}
          <button
            onClick={async () => {
              await forgotPassword(testUser.email);
              setMessage("Request Submitted");
            }}
          >
            Reset Password
          </button>
        </>
      );
    };

    await act(async () => {
      render(
        <AuthProvider>
          <Fixture />
        </AuthProvider>
      );
    });

    await act(async () => {
      userEvent.click(screen.getByText(/reset password/i));
    });
    screen.getByText(/request submitted/i);
  });

  test("resets password using token", async () => {
    mockClient.onPost("/reset-password").reply(204);

    await act(async () => {
      render(
        <AuthProvider>
          <Fixture />
        </AuthProvider>
      );
    });

    await act(async () => {
      userEvent.click(screen.getByText(/save password/i));
    });
    screen.getByText(/password was reset/i);
  });
});

describe("authenticated user", () => {
  beforeEach(() => {
    mockClient.onGet("/user").reply(200, testUser);
  });

  test("user is authenticated", async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <Fixture />
        </AuthProvider>
      );
    });

    screen.getByText(/User is logged in/);
  });

  test("user logs out successfully", async () => {
    mockClient.onPost("/logout").reply(200);

    await act(async () => {
      render(
        <AuthProvider>
          <Fixture />
        </AuthProvider>
      );
    });

    await act(async () => {
      userEvent.click(screen.getByText(/Log out/));
    });
    screen.getByText(/User is not logged in/);
  });

  test("session has expired", async () => {
    mockClient.onGet("/user").reply(204, testUser);

    await act(async () => {
      render(
        <AuthProvider>
          <Fixture />
        </AuthProvider>
      );
    });

    screen.getByText(/User is not logged in/);
  });
});

describe("admin user", () => {
  beforeEach(() => {
    mockClient.onGet("/user").reply(200, testAdminUser);
  });

  test("admin user is authenticated", async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <Fixture />
        </AuthProvider>
      );
    });

    screen.getByText(/User is admin/);
  });
});
