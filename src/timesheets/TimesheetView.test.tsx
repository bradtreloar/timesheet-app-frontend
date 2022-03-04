import React from "react";
import {
  randomDateTime,
  randomShift,
  randomTimesheet,
  randomUser,
} from "fixtures/random";
import { render } from "@testing-library/react";
import TimesheetView from "./TimesheetView";
import { range } from "lodash";

test("renders", () => {
  const user = randomUser();
  const timesheet = randomTimesheet(user);
  const startDateTime = randomDateTime();
  const shifts = range(7).map((day) =>
    randomShift(timesheet, startDateTime.plus({ days: day }))
  );

  render(<TimesheetView timesheet={timesheet} entries={shifts} />);
});
