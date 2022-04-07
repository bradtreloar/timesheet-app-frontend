import { AxiosResponse } from "axios";
import { UserResource } from "./types";
import { client, jsonAPIClient } from "datastore/clients";
import { omit } from "lodash";
import { CurrentUser } from "auth/types";
import { getCSRFCookie, UnknownError } from "datastore";

export class InvalidLoginException extends Error {
  constructor() {
    super("Invalid username or password");
  }
}

export class InvalidPasswordException extends Error {
  constructor() {
    super("Invalid password");
  }
}

export class UnauthorizedForgotPasswordException extends Error {
  constructor() {
    super("Unauthorized forgot-password attempt");
  }
}

export class UnauthorizedLogoutException extends Error {
  constructor() {
    super("Unauthorized logout attempt");
  }
}

export class UnauthorizedResetPasswordException extends Error {
  constructor() {
    super("Unauthorized password reset attempt");
  }
}

export const login = async (
  email: string,
  password: string,
  remember: boolean
): Promise<CurrentUser> => {
  await getCSRFCookie();
  try {
    const response: AxiosResponse<CurrentUser> = await client.post("/login", {
      email,
      password,
      remember,
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 422) {
      throw new InvalidLoginException();
    }
  }
  throw new UnknownError();
};

export const logout = async () => {
  await getCSRFCookie();
  try {
    await client.post("/logout");
  } catch (error: any) {
    if (error.response.status === 403) {
      throw new UnauthorizedLogoutException();
    }
  }
};

export const forgotPassword = async (email: string) => {
  await getCSRFCookie();
  try {
    await client.post("/forgot-password", {
      email,
    });
  } catch (error: any) {
    if (error.response.status === 403) {
      throw new UnauthorizedForgotPasswordException();
    }
  }
};

export const setPassword = async (password: string) => {
  await getCSRFCookie();
  try {
    await client.post("/set-password", {
      password,
    });
  } catch (error: any) {
    if (error.response?.status === 422) {
      throw new InvalidPasswordException();
    }
  }
};

export const resetPassword = async (
  email: string,
  token: string,
  password: string
) => {
  await getCSRFCookie();
  try {
    await client.post("/reset-password", {
      email,
      token,
      password,
    });
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new UnauthorizedResetPasswordException();
    }
  }
};

export const fetchCurrentUser = async (): Promise<CurrentUser | null> => {
  const response: AxiosResponse<CurrentUser> = await client.get(`/user`);
  if (response.status === 204) {
    // No current user.
    return null;
  }
  return response.data;
};

export const updateUser = async (user: CurrentUser): Promise<CurrentUser> => {
  await getCSRFCookie();
  const response: AxiosResponse<{
    data: UserResource;
  }> = await jsonAPIClient.patch(`/users/${user.id}`, {
    data: {
      id: user.id,
      type: "users",
      attributes: omit(user, ["id"]),
    },
  });
  const { data } = response.data;
  return {
    id: data.id,
    ...data.attributes,
  };
};
