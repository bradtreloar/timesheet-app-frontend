import React from "react";
import { act, render, screen } from "@testing-library/react";
import { ProvidersFixture } from "fixtures/context";
import NotFoundPage from "./NotFoundPage";
import * as datastore from "datastore";
import { MemoryRouter } from "react-router";

jest.mock("datastore");
jest.spyOn(datastore, "fetchCurrentUser").mockResolvedValue(null);

const Fixture: React.FC = () => {
  return (
    <ProvidersFixture>
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    </ProvidersFixture>
  );
};

test("renders 404 page", async () => {
  await act(async () => {
    render(<Fixture />);
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/404/i);
});
