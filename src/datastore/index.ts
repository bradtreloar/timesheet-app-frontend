import { AxiosResponse } from "axios";
import {
  parseEntity,
  makeNewEntityResource,
  makeEntityResource,
} from "./adapters";
import { EntityResource, Filters, UserResource } from "./types";
import { client, jsonAPIClient } from "datastore/clients";
import { EntityAttributesGetter, EntityType } from "store/types";
import { EntityRelationships } from "store/entity";
import assert from "assert";
import { omit } from "lodash";
import { CurrentUser } from "auth/types";

export class UnknownError extends Error {
  constructor() {
    super("Unknown error has occurred");
  }
}

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

export const getCSRFCookie = () => client.get("/csrf-cookie");

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

export const fetchEntities = async <T extends string, A>(
  type: T,
  attributesGetter: EntityAttributesGetter<A>,
  relationships: EntityRelationships,
  filters?: Filters
): Promise<EntityType<A>[]> => {
  const params = {} as Record<string, string>;
  if (filters?.changedAfter) {
    params["filter[updated-after]"] = filters?.changedAfter;
  }
  const response: AxiosResponse<{
    data: EntityResource<T, A>[];
  }> = await jsonAPIClient.get(`/${type}`, {
    params,
  });
  const { data } = response.data;
  return data.map((resource) => {
    return parseEntity(attributesGetter, relationships, resource);
  });
};

export const fetchEntitiesBelongingTo = async <T extends string, A>(
  type: T,
  attributesGetter: EntityAttributesGetter<A>,
  relationships: EntityRelationships,
  belongsToID: string
): Promise<EntityType<A>[]> => {
  const { belongsTo } = relationships;
  assert(belongsTo !== undefined);
  const response: AxiosResponse<{
    data: EntityResource<T, A>[];
  }> = await jsonAPIClient.get(`/${belongsTo.type}/${belongsToID}/${type}`);
  const { data } = response.data;
  return data.map((resource) => {
    return parseEntity(attributesGetter, relationships, resource);
  });
};

export const createEntity = async <T extends string, B, A>(
  type: T,
  attributesGetter: EntityAttributesGetter<A>,
  relationships: EntityRelationships,
  attributes: A
): Promise<EntityType<A>> => {
  await getCSRFCookie();
  const resource = makeNewEntityResource(type, attributes);
  const response: AxiosResponse<{
    data: EntityResource<T, A>;
  }> = await jsonAPIClient.post(`/${type}`, {
    data: resource,
  });
  const { data } = response.data;
  return parseEntity(attributesGetter, relationships, data);
};

export const createEntityBelongingTo = async <T extends string, A>(
  type: T,
  attributesGetter: EntityAttributesGetter<A>,
  relationships: EntityRelationships,
  belongsToID: string,
  attributes: A
): Promise<EntityType<A>> => {
  const { belongsTo } = relationships;
  assert(belongsTo !== undefined);
  await getCSRFCookie();
  const resource = makeNewEntityResource(type, attributes);
  const response: AxiosResponse<{
    data: EntityResource<T, A>;
  }> = await jsonAPIClient.post(`/${belongsTo.type}/${belongsToID}/${type}`, {
    data: resource,
  });
  const { data } = response.data;
  return parseEntity(attributesGetter, relationships, data);
};

export const updateEntity = async <T extends string, A>(
  type: T,
  attributesGetter: EntityAttributesGetter<A>,
  relationships: EntityRelationships,
  entity: EntityType<A>
): Promise<EntityType<A>> => {
  await getCSRFCookie();
  const resource = makeEntityResource(type, relationships, entity);
  const response: AxiosResponse<{
    data: EntityResource<T, A>;
  }> = await jsonAPIClient.patch(`/${type}/${entity.id}`, {
    data: resource,
  });
  const { data } = response.data;
  return parseEntity(attributesGetter, relationships, data);
};

export const deleteEntity = async <T extends string, A>(
  type: T,
  entity: EntityType<A>
): Promise<EntityType<A>> => {
  await getCSRFCookie();
  await jsonAPIClient.delete(`/${type}/${entity.id}`);
  return entity;
};
