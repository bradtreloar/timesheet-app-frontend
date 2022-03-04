import React from "react";
import TimesheetForm, { TimesheetFormProps } from "./TimesheetForm";
import { Meta, Story } from "@storybook/react";
import { noop } from "lodash";
import { ShiftValues } from "timesheets/types";

export default {
  title: "TimesheetForm",
  component: TimesheetForm,
} as Meta;

const Template: Story<TimesheetFormProps> = (args) => (
  <TimesheetForm
    {...args}
    onSubmitDefaultShiftValues={noop}
    onSubmitTimesheet={noop}
  />
);

const SHIFT = {
  isActive: true,
  reason: "none",
  startTime: {
    hour: "9",
    minute: "00",
  },
  endTime: {
    hour: "17",
    minute: "00",
  },
  breakDuration: {
    hour: "0",
    minute: "45",
  },
} as ShiftValues;

export const Default = Template.bind({});
Default.args = {
  defaultShiftValues: [SHIFT, SHIFT, SHIFT, SHIFT, SHIFT, SHIFT, SHIFT],
};
