import { noop } from "lodash";
import React from "react";
import TimeInput, { TimeInputProps } from "./TimeInput";
import { Meta, Story } from "@storybook/react";

export default {
  title: "TimeInput",
  component: TimeInput,
} as Meta;

const Template: Story<TimeInputProps> = (args) => (
  <TimeInput {...args} onChange={noop} />
);

export const Default = Template.bind({});
Default.args = {
  value: {
    hour: "",
    minute: "",
  },
};
