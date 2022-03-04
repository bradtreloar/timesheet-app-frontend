import { configureStore } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import timesheets from "timesheets/store/timesheets";
import users from "users/store/users";
import shifts from "timesheets/store/shifts";
import absences from "timesheets/store/absences";
import presets from "timesheets/store/presets";
import settings from "settings/store/settings";

export const entityReducers = {
  timesheets: timesheets.reducer,
  users: users.reducer,
  shifts: shifts.reducer,
  absences: absences.reducer,
  presets: presets.reducer,
  settings: settings.reducer,
};

const createStore = () =>
  configureStore({
    reducer: {
      ...entityReducers,
    },
  });

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export default createStore;

// Typed useDispatch hook to prevent type errors.
export const useThunkDispatch = () => useDispatch<AppStore["dispatch"]>();
