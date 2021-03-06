import { AxiosResponse } from "axios";
import {
  parseEntity,
  makeNewEntityResource,
  makeEntityResource,
} from "./adapters";
import { EntityResource, Filters } from "./types";
import { jsonAPIClient } from "datastore/clients";
import {
  Entity,
  EntityAttributes,
  EntityAttributesGetter,
  EntityKeys,
  EntityRelationships,
  OwneeEntityRelationships,
} from "store/types";
import { getCSRFCookie, UnknownError } from "datastore";
import { BaseException } from "utils/exceptions";

export class EntityNotFoundException extends BaseException {
  constructor(type: string, id: string) {
    super(`Not found: ${type}/${id}`);
  }
}

export class UnauthorizedEntityRequestException extends BaseException {
  constructor(type: string, id: string) {
    super(`Access Denied: ${type}/${id}`);
  }
}

export class UnauthenticatedEntityRequestException extends BaseException {
  constructor(type: string, id: string) {
    super(`Access Denied: ${type}/${id}`);
  }
}

const handleResponseError = (type: string, id: string, error: any) => {
  const status = error.response?.status;
  if (status === 401) {
    throw new UnauthenticatedEntityRequestException(type, id);
  }
  if (status === 403) {
    throw new UnauthorizedEntityRequestException(type, id);
  }
  if (status === 404) {
    throw new EntityNotFoundException(type, id);
  }
  throw new UnknownError();
};

export const fetchEntity = async <
  T extends string,
  A extends EntityAttributes,
  K extends EntityKeys
>(
  type: T,
  id: string,
  attributesGetter: EntityAttributesGetter<A>,
  relationships: EntityRelationships
): Promise<Entity<A, K>> => {
  try {
    const response: AxiosResponse<{
      data: EntityResource<T, A>;
    }> = await jsonAPIClient.get(`/${type}/${id}`);
    const { data } = response.data;
    return parseEntity<T, A, K>(attributesGetter, relationships, data);
  } catch (error: any) {
    handleResponseError(type, id, error);
  }
  throw new UnknownError();
};

export const fetchEntities = async <
  T extends string,
  A extends EntityAttributes,
  K extends EntityKeys
>(
  type: T,
  attributesGetter: EntityAttributesGetter<A>,
  relationships: EntityRelationships,
  filters?: Filters
): Promise<Entity<A, K>[]> => {
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
    return parseEntity<T, A, K>(attributesGetter, relationships, resource);
  });
};

export const fetchEntitiesBelongingTo = async <
  T extends string,
  A extends EntityAttributes,
  K extends EntityKeys
>(
  type: T,
  attributesGetter: EntityAttributesGetter<A>,
  relationships: OwneeEntityRelationships,
  belongsToID: string
): Promise<Entity<A, K>[]> => {
  const { belongsTo } = relationships;
  try {
    const response: AxiosResponse<{
      data: EntityResource<T, A>[];
    }> = await jsonAPIClient.get(`/${belongsTo.type}/${belongsToID}/${type}`);
    const { data } = response.data;
    return data.map((resource) => {
      return parseEntity<T, A, K>(attributesGetter, relationships, resource);
    });
  } catch (error: any) {
    handleResponseError(type, belongsToID, error);
  }
  throw new UnknownError();
};

export const createEntity = async <
  T extends string,
  A extends EntityAttributes,
  K extends EntityKeys
>(
  type: T,
  attributesGetter: EntityAttributesGetter<A>,
  relationships: EntityRelationships,
  attributes: A
): Promise<Entity<A, K>> => {
  await getCSRFCookie();
  const resource = makeNewEntityResource(type, attributes);
  const response: AxiosResponse<{
    data: EntityResource<T, A>;
  }> = await jsonAPIClient.post(`/${type}`, {
    data: resource,
  });
  const { data } = response.data;
  return parseEntity<T, A, K>(attributesGetter, relationships, data);
};

export const createEntityBelongingTo = async <
  T extends string,
  A extends EntityAttributes,
  K extends EntityKeys
>(
  type: T,
  attributesGetter: EntityAttributesGetter<A>,
  relationships: OwneeEntityRelationships,
  belongsToID: string,
  attributes: A
): Promise<Entity<A, K>> => {
  const { belongsTo } = relationships;
  await getCSRFCookie();
  const resource = makeNewEntityResource(type, attributes);
  try {
    const response: AxiosResponse<{
      data: EntityResource<T, A>;
    }> = await jsonAPIClient.post(`/${belongsTo.type}/${belongsToID}/${type}`, {
      data: resource,
    });
    const { data } = response.data;
    return parseEntity<T, A, K>(attributesGetter, relationships, data);
  } catch (error: any) {
    handleResponseError(type, belongsToID, error);
  }
  throw new UnknownError();
};

export const updateEntity = async <
  T extends string,
  A extends EntityAttributes,
  K extends EntityKeys
>(
  type: T,
  attributesGetter: EntityAttributesGetter<A>,
  relationships: EntityRelationships,
  entity: Entity<A, K>
): Promise<Entity<A, K>> => {
  await getCSRFCookie();
  const resource = makeEntityResource(type, relationships, entity);
  try {
    const response: AxiosResponse<{
      data: EntityResource<T, A>;
    }> = await jsonAPIClient.patch(`/${type}/${entity.id}`, {
      data: resource,
    });
    const { data } = response.data;
    return parseEntity<T, A, K>(attributesGetter, relationships, data);
  } catch (error: any) {
    handleResponseError(type, entity.id, error);
  }
  throw new UnknownError();
};

export const deleteEntity = async <
  T extends string,
  A extends EntityAttributes,
  K extends EntityKeys
>(
  type: T,
  entity: Entity<A, K>
): Promise<Entity<A, K>> => {
  await getCSRFCookie();
  try {
    await jsonAPIClient.delete(`/${type}/${entity.id}`);
  } catch (error: any) {
    handleResponseError(type, entity.id, error);
  }
  return entity;
};
