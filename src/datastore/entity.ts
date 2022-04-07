import { AxiosResponse } from "axios";
import {
  parseEntity,
  makeNewEntityResource,
  makeEntityResource,
} from "./adapters";
import { EntityResource, Filters } from "./types";
import { jsonAPIClient } from "datastore/clients";
import assert from "assert";
import {
  Entity,
  EntityAttributes,
  EntityAttributesGetter,
  EntityKeys,
  EntityRelationships,
} from "store/types";
import { getCSRFCookie } from "datastore";

export const fetchEntity = async <
  T extends string,
  A extends EntityAttributes,
  K extends EntityKeys
>(
  type: T,
  id: string,
  attributesGetter: EntityAttributesGetter<A>,
  relationships: EntityRelationships
) => {
  const response: AxiosResponse<{
    data: EntityResource<T, A>;
  }> = await jsonAPIClient.get(`/${type}/${id}`);
  const { data } = response.data;
  return parseEntity(attributesGetter, relationships, data);
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
    return parseEntity(attributesGetter, relationships, resource);
  });
};

export const fetchEntitiesBelongingTo = async <
  T extends string,
  A extends EntityAttributes,
  K extends EntityKeys
>(
  type: T,
  attributesGetter: EntityAttributesGetter<A>,
  relationships: EntityRelationships,
  belongsToID: string
): Promise<Entity<A, K>[]> => {
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
  return parseEntity(attributesGetter, relationships, data);
};

export const createEntityBelongingTo = async <
  T extends string,
  A extends EntityAttributes,
  K extends EntityKeys
>(
  type: T,
  attributesGetter: EntityAttributesGetter<A>,
  relationships: EntityRelationships,
  belongsToID: string,
  attributes: A
): Promise<Entity<A, K>> => {
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
  const response: AxiosResponse<{
    data: EntityResource<T, A>;
  }> = await jsonAPIClient.patch(`/${type}/${entity.id}`, {
    data: resource,
  });
  const { data } = response.data;
  return parseEntity(attributesGetter, relationships, data);
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
  await jsonAPIClient.delete(`/${type}/${entity.id}`);
  return entity;
};
