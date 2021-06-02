import React from "react";
import { Meta, Story } from "@storybook/react";

import Throbber from "./Throbber";

export default {
  component: Throbber,
  title: "Throbber",
} as Meta;

const Template: Story = () => <Throbber />;

export const Default = Template.bind({});
