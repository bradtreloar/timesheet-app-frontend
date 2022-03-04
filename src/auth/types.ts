import { ShiftValues } from "timesheets/types";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  acceptsReminders: boolean;
  isAdmin: boolean;
  defaultShiftValues: ShiftValues[];
}
