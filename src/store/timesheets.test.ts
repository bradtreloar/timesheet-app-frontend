import store from ".";
import {
  fetchTimesheets,
  addTimesheet,
  removeTimesheet,
  selectTimesheets,
  clearTimesheets,
} from "./timesheets";
import * as datastore from "datastore";
import {
  randomInt,
  randomTimesheet,
  randomTimesheets,
  randomUser,
} from "fixtures/random";
import { pick } from "lodash";
jest.mock("datastore");

const testUser = randomUser();

beforeEach(() => {
  jest.useFakeTimers();
  const { timesheets } = selectTimesheets(store.getState());
  expect(timesheets).toStrictEqual([]);
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.resetAllMocks();

  // Clear the store
  store.dispatch(clearTimesheets());
  const emptyTimesheets = selectTimesheets(store.getState());
  expect(emptyTimesheets.timesheets).toStrictEqual([]);
});

test("fetch timesheets", async () => {
  const testTimesheets = randomTimesheets(testUser, randomInt(5, 10));
  jest.spyOn(datastore, "fetchTimesheets").mockResolvedValue(testTimesheets);
  const action = await store.dispatch(fetchTimesheets(testUser));
  expect(action.payload).toBe(testTimesheets);
  expect(action.type).toBe("timesheets/fetchAll/fulfilled");
  const { status, timesheets } = selectTimesheets(store.getState());
  expect(status).toBe("fulfilled");
  expect(timesheets).toStrictEqual(testTimesheets);
});

test("handle failure to fetch timesheets", async () => {
  jest.spyOn(datastore, "fetchTimesheets").mockRejectedValue(undefined);
  const action = await store.dispatch(fetchTimesheets(testUser));
  expect(action.payload).toBeUndefined();
  expect(action.type).toBe("timesheets/fetchAll/rejected");
  const { status, timesheets } = selectTimesheets(store.getState());
  expect(status).toBe("rejected");
  expect(timesheets).toStrictEqual([]);
});

test("add timesheet and shifts", async () => {
  const testTimesheet = randomTimesheet(testUser);
  const addTimesheetArgs = {
    timesheet: testTimesheet,
    absences: testTimesheet.absences,
    shifts: testTimesheet.shifts,
    user: testUser,
  };
  jest.spyOn(datastore, "createTimesheet").mockImplementation((args) => {
    expect(args).toStrictEqual(addTimesheetArgs.timesheet);
    return Promise.resolve(testTimesheet);
  });
  testTimesheet.shifts.forEach((shift, index) => {
    jest.spyOn(datastore, "createShift").mockImplementationOnce((args) => {
      expect(args).toStrictEqual(addTimesheetArgs.shifts[index]);
      return Promise.resolve(shift);
    });
  });
  jest.spyOn(datastore, "completeTimesheet").mockResolvedValue(testTimesheet);
  const action = await store.dispatch(addTimesheet(addTimesheetArgs));
  expect(action.payload).toStrictEqual(testTimesheet);
  expect(action.type).toBe("timesheets/add/fulfilled");
  const { status, timesheets } = selectTimesheets(store.getState());
  expect(status).toBe("fulfilled");
  expect(timesheets).toStrictEqual([testTimesheet]);
});

test("handle failure to add timesheet", async () => {
  const testTimesheet = randomTimesheet(testUser);
  const addTimesheetArgs = {
    timesheet: testTimesheet,
    absences: testTimesheet.absences,
    shifts: testTimesheet.shifts,
    user: testUser,
  };
  jest.spyOn(datastore, "createTimesheet").mockRejectedValue(undefined);
  fetchTimesheets(testUser);
  const action = await store.dispatch(addTimesheet(addTimesheetArgs));
  expect(action.payload).toBeUndefined();
  expect(action.type).toBe("timesheets/add/rejected");
  const { status, timesheets } = selectTimesheets(store.getState());
  expect(status).toBe("rejected");
  expect(timesheets).toStrictEqual([]);
});

test("delete timesheet", async () => {
  const testTimesheets = randomTimesheets(testUser, randomInt(5, 10));
  jest.spyOn(datastore, "fetchTimesheets").mockResolvedValue(testTimesheets);
  await store.dispatch(fetchTimesheets(testUser));
  const deletedTimesheet = testTimesheets[0];
  jest.spyOn(datastore, "deleteTimesheet").mockResolvedValue(deletedTimesheet);
  const action = await store.dispatch(removeTimesheet(deletedTimesheet));
  expect(action.payload).toStrictEqual(deletedTimesheet);
  expect(action.type).toBe("timesheets/remove/fulfilled");
  const { status, timesheets } = selectTimesheets(store.getState());
  expect(status).toBe("fulfilled");
  expect(timesheets).not.toContain(deletedTimesheet);
});

test("fail to delete timesheet", async () => {
  const testTimesheets = randomTimesheets(testUser, randomInt(5, 10));
  jest.spyOn(datastore, "fetchTimesheets").mockResolvedValue(testTimesheets);
  jest.spyOn(datastore, "deleteTimesheet").mockRejectedValue(undefined);
  await store.dispatch(fetchTimesheets(testUser));
  const deletedTimesheet = testTimesheets[0];
  const action = await store.dispatch(removeTimesheet(deletedTimesheet));
  expect(action.payload).toBeUndefined();
  expect(action.type).toBe("timesheets/remove/rejected");
  const { status, timesheets } = selectTimesheets(store.getState());
  expect(status).toBe("rejected");
  expect(timesheets).toContain(deletedTimesheet);
});
