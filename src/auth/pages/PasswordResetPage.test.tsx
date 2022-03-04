import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Randomstring from "randomstring";
import { MemoryRouter, Route } from "react-router-dom";
import {
  randomCurrentUser,
  randomPassword,
  randomToken,
  randomUser,
} from "fixtures/random";
import PasswordResetPage from "./PasswordResetPage";
import { mockAuthContext, MockAuthProvider } from "fixtures/auth";
import { MessagesProvider } from "messages/context";
import { AuthContextValue } from "auth/context";
import { CurrentUser } from "auth/types";

const Fixture: React.FC<{
  user: CurrentUser;
  token: string;
  authContextValue: Partial<AuthContextValue>;
}> = ({ user, token, authContextValue }) => {
  return (
    <MockAuthProvider value={authContextValue}>
      <MessagesProvider>
        <MemoryRouter
          initialEntries={[`/reset-password/${user.email}/${token}`]}
        >
          <Route path="/reset-password/:email/:token">
            <PasswordResetPage />
          </Route>
          <Route path="/login">
            <p>Log in</p>
          </Route>
        </MemoryRouter>
      </MessagesProvider>
    </MockAuthProvider>
  );
};

afterEach(() => {
  jest.clearAllMocks();
});

test("renders password reset page", async () => {
  const user = randomCurrentUser();
  const token = randomToken();

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: false,
          user: null,
        }}
        user={user}
        token={token}
      />
    );
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/set new password/i);
  screen.getByLabelText(/^new password/i);
  screen.getByLabelText(/re-enter new password/i);
});

test("handles PasswordForm submission", async () => {
  const user = randomCurrentUser();
  const token = randomToken();
  const password = randomPassword();
  const mockResetPassword = jest.fn();

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: false,
          user: null,
          resetPassword: mockResetPassword,
        }}
        user={user}
        token={token}
      />
    );
  });

  userEvent.type(screen.getByLabelText(/^new password/i), password);
  userEvent.type(screen.getByLabelText(/re-enter new password/i), password);
  await act(async () => {
    userEvent.click(screen.getByTestId("password-form-submit"));
  });

  expect(mockResetPassword).toHaveBeenCalledWith(user.email, token, password);
});

test("displays error when password update fails", async () => {
  const user = randomCurrentUser();
  const token = randomToken();
  const password = randomPassword();
  const mockResetPassword = jest.fn();
  mockResetPassword.mockRejectedValue(new Error("Unable to reset password"));

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: false,
          user: null,
          resetPassword: mockResetPassword,
        }}
        user={user}
        token={token}
      />
    );
  });

  userEvent.type(screen.getByLabelText(/^new password/i), password);
  userEvent.type(screen.getByLabelText(/re-enter new password/i), password);
  await act(async () => {
    userEvent.click(screen.getByTestId("password-form-submit"));
  });

  screen.getByText(/unable to reset password/i);
});
