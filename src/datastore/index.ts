import axios, { AxiosResponse } from "axios";
import { API_HOST } from "settings";
import {
  parseTimesheet,
  parseShift,
  makeShiftResource,
  parseSetting,
  makeSettingResource,
  parseUser,
  makeUserResource,
  makeAbsenceResource,
  parseAbsence,
  makeNewTimesheetResource,
  makeNewShiftResource,
  makeNewAbsenceResource,
  makeNewUserResource,
  parsePreset,
} from "./adapters";
import { orderBy } from "lodash";
import {
  AbsenceResource,
  NewTimesheetResource,
  NewUserResource,
  PresetResource,
  SettingResource,
  ShiftResource,
  TimesheetResource,
  UserResource,
} from "./types";
import {
  Absence,
  AbsenceAttributes,
  Preset,
  Setting,
  Shift,
  ShiftAttributes,
  Timesheet,
  TimesheetAttributes,
  User,
  UserAttributes,
} from "store/types";

export const client = axios.create({
  baseURL: `${API_HOST}`,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export const jsonAPIClient = axios.create({
  baseURL: `${API_HOST}`,
  withCredentials: true,
  headers: {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
  },
});

export const login = async (
  email: string,
  password: string,
  remember: boolean
): Promise<User> => {
  await client.get("/csrf-cookie");
  const response: AxiosResponse<User> = await client.post("/login", {
    email,
    password,
    remember,
  });
  return response.data;
};

export const logout = async () => {
  await client.get("/csrf-cookie");
  await client.post("/logout");
};

export const forgotPassword = async (email: string) => {
  await client.get("/csrf-cookie");
  await client.post("/forgot-password", {
    email,
  });
};

export const setPassword = async (password: string) => {
  await client.get("/csrf-cookie");
  await client.post("/set-password", {
    password,
  });
};

export const resetPassword = async (
  email: string,
  token: string,
  password: string
) => {
  await client.get("/csrf-cookie");
  await client.post("/reset-password", {
    email,
    token,
    password,
  });
};

export const fetchCurrentUser = async (): Promise<User | null> => {
  const response: AxiosResponse<User> = await client.get(`/user`);
  if (response.status === 204) {
    // No current user.
    return null;
  }
  return response.data;
};

export const fetchUsers = async (): Promise<User[]> => {
  const response: AxiosResponse<{
    data: UserResource[];
  }> = await jsonAPIClient.get(`users`);
  const { data } = response.data;
  return data.map((resource: UserResource) => {
    return parseUser(resource);
  });
};

export const createUser = async (
  userAttributes: UserAttributes
): Promise<User> => {
  await client.get("/csrf-cookie");
  const userResource: NewUserResource = makeNewUserResource(userAttributes);
  const response: AxiosResponse<{
    data: UserResource;
  }> = await jsonAPIClient.post(`/users`, {
    data: userResource,
  });
  const { data } = response.data;
  return parseUser(data);
};

export const updateUser = async (user: User): Promise<User> => {
  await client.get("/csrf-cookie");
  const userResource: UserResource = makeUserResource(user);
  const response: AxiosResponse<{
    data: UserResource;
  }> = await jsonAPIClient.patch(`/users/${user.id}`, {
    data: userResource,
  });
  const { data } = response.data;
  return parseUser(data);
};

export const deleteUser = async (user: User): Promise<User> => {
  await client.get("/csrf-cookie");
  await jsonAPIClient.delete(`/users/${user.id}`);
  return user;
};

export const fetchTimesheets = async (user: User): Promise<Timesheet[]> => {
  const response: AxiosResponse<{
    data: TimesheetResource[];
    included?: (ShiftResource | AbsenceResource)[];
  }> = await jsonAPIClient.get(`users/${user.id}/timesheets`, {
    params: {
      include: "shifts,absences",
      sort: "-created-at",
    },
  });
  const { data, included } = response.data;

  const shiftResources =
    included !== undefined
      ? (included.filter(({ type }) => type === "shifts") as ShiftResource[])
      : [];

  const absenceResources =
    included !== undefined
      ? (included.filter(
          ({ type }) => type === "absences"
        ) as AbsenceResource[])
      : [];

  const allShifts = shiftResources.map((shiftResource) =>
    parseShift(shiftResource)
  );
  const allAbsences = absenceResources.map((absenceResource) =>
    parseAbsence(absenceResource)
  );

  const timesheets = data.map((resource: TimesheetResource) => {
    const timesheet = parseTimesheet(resource);
    const relatedShiftResources = resource.relationships.shifts;
    const relatedAbsenceResources = resource.relationships.absences;
    if (relatedShiftResources !== undefined) {
      const shiftIds = relatedShiftResources.data.map(({ id }) => id);
      const shifts = orderBy(
        allShifts.filter(({ id }) => shiftIds.includes(id as string)),
        "start",
        "asc"
      );
      timesheet.shifts = shifts;
    }
    if (relatedAbsenceResources !== undefined) {
      const absenceIds = relatedAbsenceResources.data.map(({ id }) => id);
      const absences = orderBy(
        allAbsences.filter(({ id }) => absenceIds.includes(id as string)),
        "date",
        "asc"
      );
      timesheet.absences = absences;
    }
    return timesheet;
  });

  return timesheets;
};

export const createShift = async (
  shiftAttributes: ShiftAttributes,
  timesheet: Timesheet
): Promise<Shift> => {
  await client.get("/csrf-cookie");
  const shiftResource = makeNewShiftResource(shiftAttributes, timesheet);
  const response: AxiosResponse<{
    data: ShiftResource;
  }> = await jsonAPIClient.post(`/shifts`, {
    data: shiftResource,
  });
  const { data } = response.data;
  return parseShift(data);
};

export const createAbsence = async (
  absenceAttributes: AbsenceAttributes,
  timesheet: Timesheet
): Promise<Absence> => {
  await client.get("/csrf-cookie");
  const absenceResource = makeNewAbsenceResource(absenceAttributes, timesheet);
  const response: AxiosResponse<{
    data: AbsenceResource;
  }> = await jsonAPIClient.post(`/absences`, {
    data: absenceResource,
  });
  const { data } = response.data;
  return parseAbsence(data);
};

export const createTimesheet = async (
  timesheetAttributes: TimesheetAttributes,
  user: User
): Promise<Timesheet> => {
  await client.get("/csrf-cookie");
  const timesheetResource: NewTimesheetResource = makeNewTimesheetResource(
    timesheetAttributes,
    user
  );
  const response: AxiosResponse<{
    data: TimesheetResource;
  }> = await jsonAPIClient.post(`/timesheets`, {
    data: timesheetResource,
  });
  const { data } = response.data;
  return parseTimesheet(data);
};

export const deleteTimesheet = async (
  timesheet: Timesheet
): Promise<Timesheet> => {
  await client.get("/csrf-cookie");
  await jsonAPIClient.delete(`/timesheets`);
  return timesheet;
};

export const fetchSettings = async (): Promise<Setting[]> => {
  const response: AxiosResponse<{
    data: SettingResource[];
  }> = await jsonAPIClient.get(`settings`);
  const { data } = response.data;
  return data.map((resource: SettingResource) => {
    const { id } = resource;
    const { name, value, changed, created } = resource.attributes;
    return { id, name, value, changed, created };
  });
};

export const fetchUnrestrictedSettings = async (): Promise<Setting[]> => {
  const response: AxiosResponse<{
    data: SettingResource[];
  }> = await jsonAPIClient.get(`settings`, {
    params: {
      "filter[is_restricted]": 0,
    },
  });
  const { data } = response.data;
  return data.map((resource: SettingResource) => {
    const { id } = resource;
    const { name, value, changed, created } = resource.attributes;
    return { id, name, value, changed, created };
  });
};

export const completeTimesheet = async (
  timesheet: Timesheet
): Promise<Timesheet> => {
  await client.get("/csrf-cookie");
  await client.post(`/timesheets/${timesheet.id}/complete`);
  return timesheet;
};

export const updateSettings = async (
  settings: Setting[]
): Promise<Setting[]> => {
  return await Promise.all(
    settings.map(async (setting) => {
      await client.get("/csrf-cookie");
      const response: AxiosResponse<{
        data: SettingResource;
      }> = await jsonAPIClient.patch(`settings/${setting.id}`, {
        data: makeSettingResource(setting),
      });
      const { data } = response.data;
      return parseSetting(data);
    })
  );
};

export const fetchPresets = async (user: User): Promise<Preset[]> => {
  const response: AxiosResponse<{
    data: PresetResource[];
  }> = await jsonAPIClient.get(`users/${user.id}/presets`);
  const { data } = response.data;
  return data.map((resource: PresetResource) => {
    return parsePreset(resource);
  });
};
