import { AnyAction } from "redux";
import { ThunkAction } from "@reduxjs/toolkit";
import { RootState } from "store/createStore";

export type AppThunkAction = ThunkAction<void, RootState, null, AnyAction>;

export type AppAsyncThunkAction = ThunkAction<
  Promise<void>,
  RootState,
  null,
  AnyAction
>;
