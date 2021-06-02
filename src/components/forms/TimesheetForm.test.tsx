import React from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TimesheetForm from "./TimesheetForm";
import { randomReason, randomShiftValuesArray } from "fixtures/random";
import randomstring from "randomstring";
import { noop, range } from "lodash";
import { DateTime } from "luxon";

export const EMPTY_SHIFT_TIMES = {
  isActive: false,
  reason: "rostered-day-off",
  startTime: { hour: "", minute: "" },
  endTime: { hour: "", minute: "" },
  breakDuration: { hour: "", minute: "" },
} as ShiftValues;

const paddedValue = (value: string) =>
  value === "" ? value : value.padStart(2, "0");

const timeInputs = (shiftValues: ShiftValues) => [
  {
    label: /start/i,
    value: shiftValues.startTime,
  },
  {
    label: /end/i,
    value: shiftValues.endTime,
  },
  {
    label: /break/i,
    value: shiftValues.breakDuration,
  },
];

const getShiftInput = (index: number) =>
  screen.getAllByLabelText(/^shift$/i)[index];

const getTimeInput = (shiftIndex: number, label: RegExp) => {
  const shiftInput = screen.getAllByLabelText(/^shift$/i)[shiftIndex];
  return within(shiftInput).getByLabelText(label);
};

const getHourInput = (shiftIndex: number, label: RegExp) => {
  const timeInput = getTimeInput(shiftIndex, label);
  return within(timeInput).getByLabelText(/hour/i);
};

const getMinuteInput = (shiftIndex: number, label: RegExp) => {
  const timeInput = getTimeInput(shiftIndex, label);
  return within(timeInput).getByLabelText(/minute/i);
};

const clickShiftToggle = (index: number) => {
  const shiftInput = screen.getAllByLabelText(/^shift$/i)[index];
  const checkbox = within(shiftInput).getByTestId(`shift-${index}-toggle`);
  userEvent.click(checkbox);
};

export const enterShiftValues = (index: number, shiftValues: ShiftValues) => {
  for (let { label, value } of timeInputs(shiftValues)) {
    if (value !== null) {
      if (value.hour !== null) {
        userEvent.clear(getHourInput(index, label));
        expect(getHourInput(index, label).getAttribute("value")).toEqual("");
        userEvent.type(getHourInput(index, label), value.hour.toString());
        expect(getHourInput(index, label).getAttribute("value")).toEqual(value.hour.toString());
      }
      if (value.minute !== null) {
        userEvent.clear(getMinuteInput(index, label));
        expect(getMinuteInput(index, label).getAttribute("value")).toEqual("");
        userEvent.type(getMinuteInput(index, label), value.minute.toString());
        expect(getMinuteInput(index, label).getAttribute("value")).toEqual(value.minute.toString());
      }
    }
  }
};

export const eraseShiftInputValues = (index: number) => {
  const shiftInput = getShiftInput(index);
  const inputLabels = [/start/i, /end/i, /break/i];

  for (let label of inputLabels) {
    const hourInput = getHourInput(index, label);
    userEvent.clear(hourInput);
    userEvent.clear(getMinuteInput(index, label));
  }
};

export const expectShiftInputValues = (
  index: number,
  shiftValues: ShiftValues
) => {
  for (let { label, value } of timeInputs(shiftValues)) {
    const { hour, minute } = value;
    expect(getHourInput(index, label).getAttribute("value")).toEqual(hour);
    expect(getMinuteInput(index, label).getAttribute("value")).toEqual(
      paddedValue(minute)
    );
  }
};

export const expectValidShift = (shift: Shift) => {
  expect(typeof shift.start).toBe("string");
  expect(typeof shift.end).toBe("string");
  expect(typeof shift.breakDuration).toBe("number");
};

test("renders", () => {
  const testShifts = randomShiftValuesArray();
  render(
    <TimesheetForm
      defaultShiftValues={testShifts}
      onSubmitTimesheet={noop}
      onSubmitDefaultShiftValues={noop}
    />
  );

  const shiftInputs = screen.getAllByLabelText(/^shift$/i);
  shiftInputs.forEach((shiftInput, index) => {
    const testShiftValues = testShifts[index];
    const startTimeInput = within(shiftInput).getByLabelText(/start/i);
    expect(within(startTimeInput).getByLabelText(/hour/i)).toHaveValue(
      testShiftValues.startTime.hour
    );
    expect(within(startTimeInput).getByLabelText(/minute/i)).toHaveValue(
      paddedValue(testShiftValues.startTime.minute)
    );
  });
});

test("toggles shift time input when shift checkbox is clicked", async () => {
  const testShifts = randomShiftValuesArray();
  render(
    <TimesheetForm
      defaultShiftValues={testShifts}
      onSubmitTimesheet={noop}
      onSubmitDefaultShiftValues={noop}
    />
  );

  let shiftInput = screen.getAllByLabelText(/^shift$/i)[0];
  within(shiftInput).getByLabelText(/start/i);
  // Toggle shift off.
  clickShiftToggle(0);
  shiftInput = screen.getAllByLabelText(/^shift$/i)[0];
  expect(within(shiftInput).queryByLabelText(/start/i)).toBeNull();
  within(shiftInput).getByLabelText(/reason/i);
  within(shiftInput).getByText(/select a reason/i);
  // Toggle shift on.
  clickShiftToggle(0);
  shiftInput = screen.getAllByLabelText(/^shift$/i)[0];
  within(shiftInput).getByLabelText(/start/i);
  expect(
    within(within(shiftInput).getByLabelText(/start/i))
      .getByLabelText(/hour/i)
      .getAttribute("value")
  ).toEqual("");
});

test("handles erasing shift times", () => {
  const testShifts = randomShiftValuesArray();
  render(
    <TimesheetForm
      defaultShiftValues={testShifts}
      onSubmitTimesheet={noop}
      onSubmitDefaultShiftValues={noop}
    />
  );

  const shiftInputs = screen.getAllByLabelText(/^shift$/i);
  for (let index = 0; index < shiftInputs.length; index++) {
    eraseShiftInputValues(index);
    expectShiftInputValues(index, EMPTY_SHIFT_TIMES);
  }
});

test("handles entering shift times", async () => {
  const testShifts = randomShiftValuesArray();
  render(
    <TimesheetForm
      defaultShiftValues={testShifts}
      onSubmitTimesheet={noop}
      onSubmitDefaultShiftValues={noop}
    />
  );

  const shiftInputs = screen.getAllByLabelText(/^shift$/i);
  for (let index = 0; index < shiftInputs.length; index++) {
    const testShiftValues = testShifts[index];
    enterShiftValues(index, testShiftValues);
    expectShiftInputValues(index, testShiftValues);
  }
});

describe("calls timesheet submit handler when submit button clicked", () => {
  test("with all shifts active", (done) => {
    const testShifts = randomShiftValuesArray();
    render(
      <TimesheetForm
        defaultShiftValues={testShifts}
        onSubmitTimesheet={({ shifts }) => {
          expect(shifts.length).toEqual(testShifts.length);
          shifts.forEach((shift) => expectValidShift(shift));
          done();
        }}
        onSubmitDefaultShiftValues={noop}
      />
    );
    userEvent.click(screen.getByText(/^submit/i));
  });

  test("with only some shifts active", (done) => {
    const testShifts = randomShiftValuesArray();
    testShifts.pop();
    testShifts.push(EMPTY_SHIFT_TIMES);
    render(
      <TimesheetForm
        defaultShiftValues={testShifts}
        onSubmitTimesheet={({ shifts }) => {
          expect(shifts.length).toEqual(testShifts.length - 1);
          shifts.forEach((shift) => expectValidShift(shift));
          done();
        }}
        onSubmitDefaultShiftValues={noop}
      />
    );
    userEvent.click(screen.getByText(/^submit/i));
  });
});

describe("displays errors when invalid input is entered", () => {
  test("with incomplete shift", () => {
    const testShifts: ShiftValues[] = randomShiftValuesArray();
    testShifts[0].breakDuration = {
      hour: "",
      minute: "",
    };
    render(
      <TimesheetForm
        defaultShiftValues={testShifts}
        onSubmitTimesheet={() => {
          throw new Error(
            `onSubmitTimesheet should not be called with invalid shift time.`
          );
        }}
        onSubmitDefaultShiftValues={noop}
      />
    );
    expect(screen.queryByText(/enter time/i)).toBeNull();
    userEvent.click(screen.getByText(/^submit/i));
    expect(screen.getAllByText(/required/i)).toHaveLength(2);
  });

  test("with invalid comment length", () => {
    const testShifts = randomShiftValuesArray();
    render(
      <TimesheetForm
        defaultShiftValues={testShifts}
        onSubmitTimesheet={() => {
          throw new Error(
            `onSubmitTimesheet should not be called with invalid comment length.`
          );
        }}
        onSubmitDefaultShiftValues={noop}
      />
    );
    userEvent.type(
      screen.getByLabelText(/comment/i),
      randomstring.generate(300)
    );
    userEvent.click(screen.getByText(/^submit/i));
  });
});

test('calls default shifts submit handler when "save defaults" button is clicked', (done) => {
  const testShifts = randomShiftValuesArray();
  render(
    <TimesheetForm
      defaultShiftValues={testShifts}
      onSubmitTimesheet={noop}
      onSubmitDefaultShiftValues={(defaultShiftValues) => {
        expect(defaultShiftValues).toEqual(testShifts);
        done();
      }}
    />
  );
  userEvent.click(screen.getByText(/^save these shifts as my default$/i));
});

test("restores form to default shifts when reset button is clicked", (done) => {
  const testShifts = randomShiftValuesArray();
  render(
    <TimesheetForm
      defaultShiftValues={testShifts}
      onSubmitTimesheet={({ shifts }) => {
        expect(shifts.length).toEqual(testShifts.length);
        shifts.forEach((shift) => expectValidShift(shift));
        done();
      }}
      onSubmitDefaultShiftValues={noop}
    />
  );
  userEvent.click(screen.getByTestId("shift-0-toggle"));
  userEvent.click(screen.getByText(/^reset form/i));
  userEvent.click(screen.getByText(/^submit/i));
});

test("disables form controls when pending prop is true", () => {
  const testShifts: ShiftValues[] = randomShiftValuesArray();
  render(
    <TimesheetForm
      defaultShiftValues={testShifts}
      onSubmitTimesheet={noop}
      onSubmitDefaultShiftValues={noop}
      pending
    />
  );

  screen.getByText(/submitting/i);
});

test('hides "save default shifts" button when shift times are not valid', () => {
  const testShifts: ShiftValues[] = randomShiftValuesArray();

  render(
    <TimesheetForm
      defaultShiftValues={testShifts}
      onSubmitTimesheet={noop}
      onSubmitDefaultShiftValues={noop}
    />
  );

  userEvent.clear(getHourInput(0, /start/i));
  userEvent.clear(getMinuteInput(0, /start/i));
  expect(screen.queryByText(/^save these shifts as my default$/i)).toBeNull();
});
