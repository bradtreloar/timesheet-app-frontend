import { ThunkAction } from "@reduxjs/toolkit";
import { AppStore, RootState } from "store/createStore";
import { actions as shiftActions } from "./shifts";
import { actions as absenceActions } from "./absences";
import { Timesheet } from "timesheets/types";
import { AppAsyncThunkAction, AppThunkAction } from "./types";

export const fetchTimesheetEntries = (
  timesheet: Timesheet
): AppAsyncThunkAction => async (dispatch, getState) => {
  await shiftActions.fetchAllBelongingTo(timesheet.id)(
    dispatch,
    getState,
    null
  );
  await absenceActions.fetchAllBelongingTo(timesheet.id)(
    dispatch,
    getState,
    null
  );
};
