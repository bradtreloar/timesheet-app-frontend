import React from "react";
import { act, render, screen } from "@testing-library/react";
import AccessDeniedPage from "./AccessDeniedPage";
import { MemoryRouter } from "react-router";
import { MessagesProvider } from "messages/context";
import { MockAuthProvider } from "fixtures/auth";
import { AuthContextValue } from "auth/context";

const Fixture: React.FC<{
  authContextValue: Partial<AuthContextValue>;
}> = ({ authContextValue }) => {
  return (
    <MockAuthProvider value={authContextValue}>
      <MessagesProvider>
        <MemoryRouter>
          <AccessDeniedPage />
        </MemoryRouter>
      </MessagesProvider>
    </MockAuthProvider>
  );
};

test("renders 403 page", async () => {
  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: false,
        }}
      />
    );
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/403/i);
});
