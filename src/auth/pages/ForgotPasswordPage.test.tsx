import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { randomCurrentUser } from "fixtures/random";
import ForgotPasswordPage from "./ForgotPasswordPage";
import * as datastore from "datastore";
import { MockAuthProvider } from "fixtures/auth";
import { AuthContextValue } from "auth/context";
import { MessagesProvider } from "messages/context";

const Fixture: React.FC<{
  authContextValue: Partial<AuthContextValue>;
}> = ({ authContextValue }) => {
  return (
    <MockAuthProvider value={authContextValue}>
      <MessagesProvider>
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>{" "}
      </MessagesProvider>
    </MockAuthProvider>
  );
};

test("renders password reset page", async () => {
  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: false,
          user: null,
        }}
      />
    );
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/reset password/i);
  screen.getByLabelText(/email Address/i);
});

test("handles ForgotPasswordForm submission", async () => {
  const user = randomCurrentUser();
  const mockForgotPassword = jest.fn();

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: false,
          user: null,
          forgotPassword: mockForgotPassword,
        }}
      />
    );
  });

  userEvent.type(screen.getByLabelText(/email Address/i), user.email);
  await act(async () => {
    userEvent.click(screen.getByTestId("password-reset-form-submit"));
  });
  expect(mockForgotPassword).toHaveBeenCalledWith(user.email);
});

test("displays error when request fails", async () => {
  const user = randomCurrentUser();
  const mockForgotPassword = jest
    .fn()
    .mockRejectedValue(new Error("Unable to request password reset"));

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: false,
          user: null,
          forgotPassword: mockForgotPassword,
        }}
      />
    );
  });

  userEvent.type(screen.getByLabelText(/email Address/i), user.email);
  await act(async () => {
    userEvent.click(screen.getByTestId("password-reset-form-submit"));
  });
  screen.getByText(/Unable to request password reset/i);
});
