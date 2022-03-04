import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { randomCurrentUser, randomPassword, randomUser } from "fixtures/random";
import LoginPage from "./LoginPage";
import { MessagesProvider } from "messages/context";
import { mockAuthContext, MockAuthProvider } from "fixtures/auth";
import { AuthContextValue } from "auth/context";

const Fixture: React.FC<{
  authContextValue: Partial<AuthContextValue>;
}> = ({ authContextValue }) => {
  return (
    <MockAuthProvider value={authContextValue}>
      <MessagesProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </MessagesProvider>
    </MockAuthProvider>
  );
};

afterEach(() => {
  jest.resetAllMocks();
});

test("renders login page", async () => {
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

  expect(screen.getByRole("heading")).toHaveTextContent(/log in/i);
  screen.getByLabelText(/email address/i);
  screen.getByLabelText(/password/i);
  screen.getByLabelText(/remember/i);
});

test("handles LoginForm submission", async () => {
  const user = randomCurrentUser();
  const password = randomPassword();
  const rememberLogin = true;
  const mockLogin = jest.fn();

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: false,
          user: null,
          login: mockLogin,
        }}
      />
    );
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/Log in/i);
  userEvent.type(screen.getByLabelText(/email address/i), user.email);
  userEvent.type(screen.getByLabelText(/password/i), password);
  userEvent.click(screen.getByLabelText(/remember/i));
  await act(async () => {
    userEvent.click(screen.getByTestId("login-form-submit"));
  });

  expect(mockLogin).toHaveBeenCalledWith(user.email, password, rememberLogin);
});

test("displays error when login fails", async () => {
  const user = randomCurrentUser();
  const password = randomPassword();
  const mockLogin = jest.fn();
  mockLogin.mockRejectedValue(new Error("Unrecognised email or password"));

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: false,
          user: null,
          login: mockLogin,
        }}
      />
    );
  });
  expect(screen.getByRole("heading")).toHaveTextContent(/Log in/i);
  userEvent.type(screen.getByLabelText(/email address/i), user.email);
  userEvent.type(screen.getByLabelText(/password/i), password);
  userEvent.click(screen.getByLabelText(/remember/i));
  await act(async () => {
    userEvent.click(screen.getByTestId("login-form-submit"));
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/Log in/i);
  screen.getByText(/unrecognised email or password/i);
});
