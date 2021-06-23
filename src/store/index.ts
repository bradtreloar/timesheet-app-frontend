import { configureStore } from "@reduxjs/toolkit";
import timesheets from "./timesheets";
import users from "./users";
import settings from "./settings";
import presets from "./presets";

const store = configureStore({
  reducer: {
    presets,
    settings,
    timesheets,
    users,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export default store;
