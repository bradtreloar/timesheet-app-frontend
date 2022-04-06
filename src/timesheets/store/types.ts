import { AnyAction } from "redux";
import { AsyncThunk, ThunkAction } from "@reduxjs/toolkit";
import { RootState } from "store/createStore";
import { createAsyncEntityActions } from "store/entity";
import { Entity, EntityAttributes, EntityKeys } from "store/types";

export type AppThunkAction = ThunkAction<void, RootState, null, AnyAction>;

export type AppAsyncThunkAction = ThunkAction<
  Promise<void>,
  RootState,
  null,
  AnyAction
>;

type EntityActions = ReturnType<typeof createAsyncEntityActions>;
