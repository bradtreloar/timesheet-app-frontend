import { orderBy } from "lodash";
import { useMemo } from "react";
import { User, UserAttributes, UserSortOrder } from "./types";

export const useSortedUsers = (users: User[], sortOrder: UserSortOrder) =>
  useMemo(
    () =>
      orderBy(users, (user) => user.attributes[sortOrder.attribute], [
        sortOrder.ascending ? "asc" : "desc",
      ]),
    [users, sortOrder]
  );
