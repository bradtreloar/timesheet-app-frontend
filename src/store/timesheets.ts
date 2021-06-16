import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as datastore from "services/datastore";
import { RootState } from ".";

export interface TimesheetsState {
  timesheets: Timesheet[];
  status: "idle" | "pending" | "fulfilled" | "rejected";
  error?: string;
}

const fetchTimesheets = createAsyncThunk(
  "timesheets/fetchAll",
  async (user: User) => {
    return await datastore.fetchTimesheets(user);
  }
);

interface AddTimesheetArgs {
  user: User;
  timesheet: TimesheetAttributes;
  shifts: ShiftAttributes[];
  absences: AbsenceAttributes[];
}

const addTimesheet = createAsyncThunk(
  "timesheets/add",
  async ({ user, timesheet, shifts, absences }: AddTimesheetArgs) => {
    const createdTimesheet = await datastore.createTimesheet(timesheet, user);
    if (shifts.length > 0) {
      createdTimesheet.shifts = await Promise.all(
        shifts.map((shift) => datastore.createShift(shift, createdTimesheet))
      );
    }
    if (absences.length > 0) {
      createdTimesheet.absences = await Promise.all(
        absences.map((absence) =>
          datastore.createAbsence(absence, createdTimesheet)
        )
      );
    }
    return await datastore.completeTimesheet(createdTimesheet);
  }
);

const removeTimesheet = createAsyncThunk(
  "timesheets/remove",
  async (timesheet: Timesheet) => {
    return await datastore.deleteTimesheet(timesheet);
  }
);

const initialState: TimesheetsState = {
  timesheets: [],
  status: "idle",
};

const timesheetsSlice = createSlice({
  name: "timesheets",
  initialState: initialState,
  reducers: {
    clear(state) {
      return {
        timesheets: [],
        status: "idle",
      };
    },
    set(state, action) {
      return {
        timesheets: action.payload,
        status: "idle",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimesheets.pending, (state) => {
        state.status = "pending";
      })
      .addCase(fetchTimesheets.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.timesheets = action.payload;
      })
      .addCase(fetchTimesheets.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
      });

    builder
      .addCase(addTimesheet.pending, (state) => {
        state.status = "pending";
      })
      .addCase(addTimesheet.fulfilled, (state, action) => {
        state.status = "fulfilled";
        // Insert new timesheet at the start of the list because
        // timesheets are sorted by descending creation date.
        state.timesheets = [action.payload, ...state.timesheets];
      })
      .addCase(addTimesheet.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
      });

    builder
      .addCase(removeTimesheet.pending, (state) => {
        state.status = "pending";
      })
      .addCase(removeTimesheet.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.timesheets = state.timesheets.filter(
          (timesheet) => timesheet.id !== action.payload.id
        );
      })
      .addCase(removeTimesheet.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
      });
  },
});

const selectTimesheets = (state: RootState) => state.timesheets;

export { fetchTimesheets, addTimesheet, removeTimesheet };
export const {
  clear: clearTimesheets,
  set: setTimesheets,
} = timesheetsSlice.actions;
export default timesheetsSlice.reducer;
export { selectTimesheets };
