import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route } from "react-router-dom";
import {
  randomCurrentUser,
  randomReason,
  randomSettings,
  randomShift,
  randomTimesheet,
  randomUser,
} from "fixtures/random";
import TimesheetFormPage from "./TimesheetFormPage";
import { Provider } from "react-redux";
import { actions as settingsActions } from "settings/store/settings";
import * as timesheetSlice from "timesheets/store/timesheets";
import * as shiftSlice from "timesheets/store/shifts";
import { DateTime } from "luxon";
import { cloneDeep, range } from "lodash";
import createStore, { AppStore } from "store/createStore";
import { buildEntityState } from "store/entity";
import { ShiftValues } from "timesheets/types";
import { MessagesProvider } from "messages/context";
import { CurrentUser } from "auth/types";
import { Time } from "utils/date";
import { MockAuthProvider } from "fixtures/auth";
import { AuthContextValue } from "auth/context";

const getFixtures = () => {
  const user = randomCurrentUser();
  const timesheet = randomTimesheet(user);
  timesheet.attributes.comment = "";
  const startDate = DateTime.now();
  const shifts = range(7).map((day) =>
    randomShift(timesheet, startDate.plus(day))
  );

  return {
    user,
    timesheet,
    shifts,
  };
};

export const EMPTY_SHIFT_TIMES = {
  isActive: false,
  reason: "rostered-day-off",
  startTime: { hour: "", minute: "" },
  endTime: { hour: "", minute: "" },
  breakDuration: { hour: "", minute: "" },
} as ShiftValues;

const Fixture: React.FC<{
  authContextValue: Partial<AuthContextValue>;
  store: AppStore;
}> = ({ authContextValue, store }) => {
  return (
    <Provider store={store}>
      <MockAuthProvider value={authContextValue}>
        <MessagesProvider>
          <MemoryRouter initialEntries={["/timesheet/new"]}>
            <Route exact path="/timesheet/new">
              <TimesheetFormPage />
            </Route>
            <Route exact path="/">
              form submitted
            </Route>
          </MemoryRouter>
        </MessagesProvider>
      </MockAuthProvider>
    </Provider>
  );
};

const createMockStore = () => {
  const store = createStore();
  store.dispatch(settingsActions.set(buildEntityState(randomSettings())));
  return store;
};

afterEach(() => {
  jest.clearAllMocks();
});

test("renders timesheet page", async () => {
  const store = createMockStore();
  const { user } = getFixtures();

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          user,
        }}
        store={store}
      />
    );
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/new timesheet/i);
});

test("handles timesheet submission", async () => {
  const store = createMockStore();
  const { user, timesheet, shifts } = getFixtures();

  const addTimesheetBelongingToSpy = jest
    // @ts-ignore
    .spyOn(timesheetSlice.actions, "addBelongingTo")
    .mockReturnValue({
      // @ts-ignore
      type: `timesheets/addBelongingTo/fulfilled`,
      payload: timesheet,
    });
  const addShiftsBelongingToSpy = shifts.map((shift) =>
    // @ts-ignore
    jest.spyOn(shiftSlice.actions, "addBelongingTo").mockReturnValue({
      // @ts-ignore
      type: `shifts/addBelongingTo/fulfilled`,
      payload: shift,
    })
  )[0];
  // @ts-ignore
  const updateTimesheetSpy = jest
    .spyOn(timesheetSlice.actions, "update")
    .mockReturnValue({
      // @ts-ignore
      type: `timesheets/update/fulfilled`,
      payload: timesheet,
    });

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          user,
        }}
        store={store}
      />
    );
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/new timesheet/i);
  await act(async () => {
    userEvent.click(screen.getByText(/^submit/i));
  });

  screen.getByText(/^form submitted/i);
  expect(addTimesheetBelongingToSpy).toHaveBeenCalledWith({
    attributes: {
      comment: timesheet.attributes.comment,
      submitted: null,
    },
    belongsToID: user.id,
  });
  const startDate = DateTime.now().startOf("week");
  const allShiftValues = user.defaultShiftValues;
  allShiftValues.forEach((shiftValues, index) => {
    const callArgs = addShiftsBelongingToSpy.mock.calls[index];
    const shiftDate = startDate.plus({ days: index });
    expect(callArgs.shift()).toStrictEqual({
      attributes: {
        start: shiftDate
          .set({
            hour: parseInt(shiftValues.startTime.hour),
            minute: parseInt(shiftValues.startTime.minute),
          })
          .toISO(),
        end: shiftDate
          .set({
            hour: parseInt(shiftValues.endTime.hour),
            minute: parseInt(shiftValues.endTime.minute),
          })
          .toISO(),
        breakDuration: new Time(
          shiftValues.breakDuration.hour,
          shiftValues.breakDuration.minute
        ).toMinutes(),
      },
      belongsToID: timesheet.id,
    });
  });
  expect(updateTimesheetSpy).toHaveBeenCalledWith(timesheet);

  const { entities } = store.getState().timesheets;
  expect(entities.allIDs).toStrictEqual([timesheet.id]);
  expect(entities.byID[timesheet.id]).toStrictEqual(timesheet);
});

test("displays error when timesheet creation fails", async () => {
  const store = createMockStore();
  const { user, timesheet, shifts } = getFixtures();

  const addTimesheetBelongingToSpy = jest
    // @ts-ignore
    .spyOn(timesheetSlice.actions, "addBelongingTo")
    .mockReturnValue({
      // @ts-ignore
      type: `timesheets/addBelongingTo/rejected`,
    });

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          user,
        }}
        store={store}
      />
    );
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/new timesheet/i);
  await act(async () => {
    userEvent.click(screen.getByText(/^submit/i));
  });
  await screen.findByText(/unable to create timesheet/i);
});

test("updates the user's default shifts and shows a confirmation message", async () => {
  const store = createStore();
  store.dispatch(settingsActions.set(buildEntityState(randomSettings())));
  const { user } = getFixtures();
  const updatedUser = cloneDeep(user);
  const mockUpdateUser = jest.fn();
  updatedUser.defaultShiftValues[0] = EMPTY_SHIFT_TIMES;

  await act(async () => {
    render(
      <Fixture
        authContextValue={{
          isAuthenticated: true,
          user,
          updateUser: mockUpdateUser,
        }}
        store={store}
      />
    );
  });

  expect(screen.getByRole("heading")).toHaveTextContent(/new timesheet/i);
  userEvent.click(screen.getByTestId("shift-0-toggle"));
  userEvent.selectOptions(
    screen.getByTestId("shift-0-reason"),
    "rostered-day-off"
  );
  await act(async () => {
    userEvent.click(screen.getByText(/save these shifts as my default/i));
  });
  await screen.findByText(/your default shifts have been updated/i);
  expect(mockUpdateUser).toHaveBeenCalledWith(updatedUser);
});
