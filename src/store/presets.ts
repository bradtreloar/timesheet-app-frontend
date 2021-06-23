import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as datastore from "services/datastore";
import { RootState } from ".";

export interface PresetsState {
  presets: Preset[];
  status: "idle" | "pending" | "fulfilled" | "rejected";
  error?: string;
}

const fetchPresets = createAsyncThunk(
  "presets/fetchAll",
  async (user: User) => {
    return await datastore.fetchPresets(user);
  }
);

interface AddPresetArgs {
  user: User;
  preset: PresetAttributes;
}

const initialState: PresetsState = {
  presets: [],
  status: "idle",
};

const presetsSlice = createSlice({
  name: "presets",
  initialState: initialState,
  reducers: {
    clear(state) {
      return {
        presets: [],
        status: "idle",
      };
    },
    set(state, action) {
      return {
        presets: action.payload,
        status: "idle",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPresets.pending, (state) => {
        state.status = "pending";
      })
      .addCase(fetchPresets.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.presets = action.payload;
      })
      .addCase(fetchPresets.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
      });
  },
});

const selectPresets = (state: RootState) => state.presets;

export { fetchPresets };
export const {
  clear: clearPresets,
  set: setPresets,
} = presetsSlice.actions;
export default presetsSlice.reducer;
export { selectPresets };
