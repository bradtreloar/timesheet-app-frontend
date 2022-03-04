import { renderHook } from "@testing-library/react-hooks";
import { randomUser } from "fixtures/random";
import { merge } from "lodash";
import { useSortedUsers } from "./hooks";

describe("useSortedUsers", () => {
  test("sorts users by name in ascending order", () => {
    const user = randomUser();
    const user1 = merge(user, {
      attributes: merge(user.attributes, {
        name: "B",
      }),
    });
    const user2 = merge(user, {
      attributes: merge(user.attributes, {
        name: "A",
      }),
    });
    const user3 = merge(user, {
      attributes: merge(user.attributes, {
        name: "C",
      }),
    });

    const { result } = renderHook(() =>
      useSortedUsers([user1, user2, user3], {
        attribute: "name",
        ascending: true,
      })
    );

    expect(result.current).toStrictEqual([user2, user1, user3]);
  });
});
