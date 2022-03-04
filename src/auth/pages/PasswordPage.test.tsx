import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { randomPassword, randomCurrentUser } from "fixtures/random";
import PasswordPage from "./PasswordPage";
import { mockAuthContext, MockAuthProvider } from "fixtures/auth";
import { MessagesProvider } from "messages/context";
import { AuthContextValue } from "auth/context";

const Fixture: React.FC<{
  authContextValue: Partial<AuthContextValue>;
}> = ({ authContextValue }) => {
  return (
    <MockAuthProvider value={authContextValue}>
      <MessagesProvider>
        <MemoryRouter>
          <PasswordPage />
        </MemoryRouter>
      </MessagesProvider>
    </MockAuthProvider>
  );
};

afterEach(() => {
  jest.resetAllMocks();
});

test("renders password page", async () => {
  const user = randomCurrentUser();

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          user,
        }}
      />
    );
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/set new password/i);
  screen.getByLabelText(/^new password/i);
  screen.getByLabelText(/re-enter new password/i);
});

test("handles PasswordForm submission", async () => {
  const user = randomCurrentUser();
  const password = randomPassword();
  const mockSetPassword = jest.fn();

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          user,
          setPassword: mockSetPassword,
        }}
      />
    );
  });

  userEvent.type(screen.getByLabelText(/^new password/i), password);
  userEvent.type(screen.getByLabelText(/re-enter new password/i), password);
  await act(async () => {
    userEvent.click(screen.getByTestId("password-form-submit"));
  });

  expect(mockSetPassword).toHaveBeenCalledWith(password);
});

test("displays error when password update fails", async () => {
  const user = randomCurrentUser();
  const password = randomPassword();
  const mockSetPassword = jest.fn();
  mockSetPassword.mockRejectedValue(new Error("Unable to set password"));

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          user,
          setPassword: mockSetPassword,
        }}
      />
    );
  });

  userEvent.type(screen.getByLabelText(/^new password/i), password);
  userEvent.type(screen.getByLabelText(/re-enter new password/i), password);
  await act(async () => {
    userEvent.click(screen.getByTestId("password-form-submit"));
  });

  screen.getByText(/unable to set password/i);
});
