import React from "react";
import { act, render, screen } from "@testing-library/react";
import NotFoundPage from "./NotFoundPage";
import * as datastore from "datastore";
import { MemoryRouter } from "react-router";
import { MockAuthProvider } from "fixtures/auth";
import { MessagesProvider } from "messages/context";

jest.mock("datastore");

const Fixture: React.FC = () => {
  return (
    <MockAuthProvider
      value={{
        isAuthenticated: false,
        user: null,
      }}
    >
      <MessagesProvider>
        <MemoryRouter>
          <NotFoundPage />
        </MemoryRouter>
      </MessagesProvider>
    </MockAuthProvider>
  );
};

test("renders 404 page", async () => {
  await act(async () => {
    render(<Fixture />);
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/404/i);
});
