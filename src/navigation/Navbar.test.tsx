import React from "react";
import { BrowserRouter } from "react-router-dom";
import { act, render, screen } from "@testing-library/react";
import Navbar from "./Navbar";
import { client } from "datastore/clients";
import MockAdapter from "axios-mock-adapter";
import { MockAuthProvider } from "fixtures/auth";
import { MessagesProvider } from "messages/context";

test("renders navbar", async () => {
  await act(async () => {
    render(
      <MockAuthProvider
        value={{
          isAuthenticated: false,
          user: null,
        }}
      >
        <MessagesProvider>
          <BrowserRouter>
            <Navbar />
          </BrowserRouter>
        </MessagesProvider>
      </MockAuthProvider>
    );
  });
  screen.getByText(/Log in/i);
});
