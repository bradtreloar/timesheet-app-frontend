import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProvidersFixture } from "fixtures/context";
import { MemoryRouter } from "react-router-dom";
import { randomUser } from "fixtures/random";
import ForgotPasswordPage from "./ForgotPasswordPage";
import * as datastore from "datastore";

jest.mock("datastore");
jest.spyOn(datastore, "fetchCurrentUser").mockResolvedValue(null);
const testUser = randomUser();

const Fixture: React.FC = () => {
  return (
    <ProvidersFixture>
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    </ProvidersFixture>
  );
};

test("renders password reset page", async () => {
  await act(async () => {
    render(<Fixture />);
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/reset password/i);
  screen.getByLabelText(/email Address/i);
});

test("handles ForgotPasswordForm submission", async () => {
  jest.spyOn(datastore, "forgotPassword").mockResolvedValue();

  await act(async () => {
    render(<Fixture />);
  });

  userEvent.type(screen.getByLabelText(/email Address/i), testUser.email);
  await act(async () => {
    userEvent.click(screen.getByTestId("password-reset-form-submit"));
  });
  expect(datastore.forgotPassword).toHaveBeenCalledWith(testUser.email);
});

test("displays error when request fails", async () => {
  jest
    .spyOn(datastore, "forgotPassword")
    .mockRejectedValue(new Error("Unable to request password reset"));

  await act(async () => {
    render(<Fixture />);
  });

  userEvent.type(screen.getByLabelText(/email Address/i), testUser.email);
  await act(async () => {
    userEvent.click(screen.getByTestId("password-reset-form-submit"));
  });
  screen.getByText(/Unable to request password reset/i);
});
