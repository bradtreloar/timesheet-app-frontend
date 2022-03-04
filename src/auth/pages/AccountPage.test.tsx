import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { randomCurrentUser } from "fixtures/random";
import React from "react";
import { MemoryRouter, Route } from "react-router";
import faker from "faker";
import AccountPage from "./AccountPage";
import { merge, values } from "lodash";
import { MockAuthProvider } from "fixtures/auth";
import { MessagesProvider } from "messages/context";
import { AuthContextValue } from "auth/context";

const Fixture: React.FC<{
  authContextValue: Partial<AuthContextValue>;
}> = ({ authContextValue }) => {
  return (
    <MockAuthProvider value={authContextValue}>
      <MessagesProvider>
        <MemoryRouter>
          <AccountPage />
        </MemoryRouter>
      </MessagesProvider>
    </MockAuthProvider>
  );
};

afterEach(() => {
  jest.resetAllMocks();
});

test("renders", async () => {
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

  expect(screen.getByRole("heading")).toHaveTextContent(/account settings/i);
  screen.getByLabelText(/name/i);
  screen.getByLabelText(/email/i);
  screen.getByLabelText(/phone number/i);
  screen.getByLabelText(/receive sms reminders/i);
});

test("handles form submit", async () => {
  const user = randomCurrentUser();
  const updatedUser = Object.assign({}, user, {
    name: faker.name.findName(),
    email: faker.internet.email(),
    phoneNumber: faker.phone.phoneNumber("04## ### ###"),
  });
  const mockUpdateUser = jest.fn();

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          user,
          updateUser: mockUpdateUser,
        }}
      />
    );
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/account settings/i);
  userEvent.clear(screen.getByLabelText(/name/i));
  userEvent.type(screen.getByLabelText(/name/i), updatedUser.name);
  userEvent.clear(screen.getByLabelText(/email/i));
  userEvent.type(screen.getByLabelText(/email/i), updatedUser.email);
  userEvent.clear(screen.getByLabelText(/phone number/i));
  userEvent.type(
    screen.getByLabelText(/phone number/i),
    updatedUser.phoneNumber
  );
  await act(async () => {
    userEvent.click(screen.getByText(/save/i));
  });

  expect(mockUpdateUser).toHaveBeenCalledWith(updatedUser);
});
