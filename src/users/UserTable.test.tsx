import React from "react";
import { render, screen } from "@testing-library/react";
import { orderBy, random, range } from "lodash";
import { randomUser } from "fixtures/random";
import UserTable from "./UserTable";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";

const Fixture: React.FC = ({ children }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

test("renders rows", () => {
  const users = range(random(8, 10)).map((index) => randomUser());
  const sortedUsers = orderBy(users, (user) => user.attributes.name, ["asc"]);
  expect(users).not.toStrictEqual(sortedUsers);

  render(
    <Fixture>
      <UserTable users={users} />
    </Fixture>
  );

  screen.getByText(/^name/i);
  screen.getByText(/email/i);

  // Check that the users are sorted in the right order
  const emailLinks = screen.getAllByText(/@/);

  sortedUsers.forEach((user, index) => {
    expect(emailLinks[index]).toHaveTextContent(user.attributes.email);
  });
});

test("handles changes in sort order", () => {
  const users = range(random(8, 10)).map((index) => randomUser());
  const usersSortedByName = orderBy(users, (user) => user.attributes.name, [
    "asc",
  ]);
  const usersSortedByEmail = orderBy(users, (user) => user.attributes.email, [
    "asc",
  ]);

  render(
    <Fixture>
      <UserTable users={users} />
    </Fixture>
  );

  let emailLinks = screen.getAllByText(/@/);
  usersSortedByName.forEach((user, index) => {
    expect(emailLinks[index]).toHaveTextContent(user.attributes.email);
  });

  // Sort by name, descending
  userEvent.click(screen.getByText(/^name/i));
  emailLinks = screen.getAllByText(/@/);
  usersSortedByName.reverse().forEach((user, index) => {
    expect(emailLinks[index]).toHaveTextContent(user.attributes.email);
  });

  // Sort by email, ascending
  userEvent.click(screen.getByText(/^email/i));
  emailLinks = screen.getAllByText(/@/);
  usersSortedByEmail.forEach((user, index) => {
    expect(emailLinks[index]).toHaveTextContent(user.attributes.email);
  });

  // Sort by email, descending
  userEvent.click(screen.getByText(/^email/i));
  emailLinks = screen.getAllByText(/@/);
  usersSortedByEmail.reverse().forEach((user, index) => {
    expect(emailLinks[index]).toHaveTextContent(user.attributes.email);
  });
});
