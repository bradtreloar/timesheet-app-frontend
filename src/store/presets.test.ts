import store from ".";
import { randomPresets, randomUser } from "fixtures/random";
import {
  clearPresets,
  fetchPresets,
  selectPresets,
  setPresets,
} from "./presets";
import * as datastore from "services/datastore";
import { clearUsers, setUsers } from "./users";
jest.mock("services/datastore");

const testUser = randomUser();

function seedStore() {
  store.dispatch(setUsers([testUser]));
  const testPresets = randomPresets(testUser);
  store.dispatch(setPresets(testPresets));
}

function clearStore() {
  store.dispatch(clearPresets());
  store.dispatch(clearUsers());
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.resetAllMocks();

  // Clear the store
  clearStore();
});

test("set presets", () => {
  const testPresets = randomPresets(testUser);
  store.dispatch(setPresets(testPresets));
  const { presets } = selectPresets(store.getState());
  expect(presets).toStrictEqual(testPresets);
});

test("clear presets", () => {
  seedStore();
  store.dispatch(clearPresets());
  const { presets } = selectPresets(store.getState());
  expect(presets).toStrictEqual([]);
});

test("fetch presets", async () => {
  store.dispatch(setUsers([testUser]));
  const testPresets = randomPresets(testUser, 2);
  jest.spyOn(datastore, "fetchPresets").mockResolvedValue(testPresets);
  await store.dispatch(fetchPresets(testUser));
  const { status, presets } = selectPresets(store.getState());
  expect(status).toBe("fulfilled");
  expect(presets).toStrictEqual(testPresets);
});
