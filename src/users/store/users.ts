import { createEntitySlice } from "store/entity";
import { EntityState } from "store/types";
import { User, UserAttributes, UserKeys } from "users/types";

const users = createEntitySlice<"users", UserAttributes, UserKeys>(
  "users",
  ({
    email,
    name,
    phoneNumber,
    acceptsReminders,
    defaultShiftValues,
    isAdmin,
  }: any): UserAttributes => ({
    email,
    name,
    phoneNumber,
    acceptsReminders,
    defaultShiftValues,
    isAdmin,
  }),
  {
    hasMany: [
      {
        type: "timesheets",
        foreignKey: "timesheets",
        backPopulates: "user",
      },
      {
        type: "presets",
        foreignKey: "presets",
        backPopulates: "user",
      },
    ],
  }
);

export const selectUsers = (state: { users: EntityState<User> }) => state.users;

export const { actions } = users;
export default users;
