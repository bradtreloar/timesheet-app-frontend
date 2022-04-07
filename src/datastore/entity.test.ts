import { client, jsonAPIClient } from "datastore/clients";
import MockAdapter from "axios-mock-adapter";
import { randomDateTime } from "fixtures/random";
import {
  createEntity,
  createEntityBelongingTo,
  deleteEntity,
  fetchEntities,
  fetchEntitiesBelongingTo,
  fetchEntity,
  updateEntity,
} from "datastore/entity";
import { mockEntityType } from "fixtures/entity";
import { makeEntityResource } from "./adapters";
import { EntityRelationship } from "store/types";

const mockClient = new MockAdapter(client);
const mockJsonAPIClient = new MockAdapter(jsonAPIClient);

beforeEach(() => {
  mockClient.onGet("/csrf-cookie").reply(204);
});

afterEach(() => {
  jest.resetAllMocks();
  mockClient.reset();
  mockJsonAPIClient.reset();
});

describe("fetchEntity", () => {
  test("fetches an entity", async () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entity = randomEntity();
    const url = `/${type}/${entity.id}`;
    mockJsonAPIClient.onGet(url).reply(200, {
      data: makeEntityResource(type, relationships, entity),
    });

    const result = await fetchEntity(
      type,
      entity.id,
      getAttributes,
      relationships
    );

    const history = mockJsonAPIClient.history;
    expect(history.get.length).toBe(1);
    expect(history.get[0].url).toBe(url);
    expect(result).toStrictEqual(entity);
  });
});

describe("fetchEntities", () => {
  test("fetches list of entities", async () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entity = randomEntity();
    const url = `/${type}`;
    mockJsonAPIClient.onGet(url).reply(200, {
      data: [makeEntityResource(type, relationships, entity)],
    });

    const result = await fetchEntities(type, getAttributes, relationships);

    const history = mockJsonAPIClient.history;
    expect(history.get.length).toBe(1);
    expect(history.get[0].url).toBe(url);
    expect(result).toStrictEqual([entity]);
  });

  test("fetches list of entities filtered by modified date", async () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entity = randomEntity();
    const date = randomDateTime();
    const url = `/${type}`;
    mockJsonAPIClient
      .onGet(url, {
        "filter[updated-after]": date.toISO(),
      })
      .reply(200, {
        data: [makeEntityResource(type, relationships, entity)],
      });

    const result = await fetchEntities(type, getAttributes, relationships, {
      changedAfter: date.toISO(),
    });

    const history = mockJsonAPIClient.history;
    expect(history.get.length).toBe(1);
    expect(history.get[0].url).toBe(url);
    expect(history.get[0].params).toStrictEqual({
      "filter[updated-after]": date.toISO(),
    });
    expect(result).toStrictEqual([entity]);
  });
});

describe("fetchEntitiesBelongingTo", () => {
  test("fetches list of entities belonging to a parent entity", async () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entity = randomEntity();
    const belongsTo = relationships.belongsTo as EntityRelationship;
    const belongsToID = entity.relationships[belongsTo.foreignKey] as string;
    const url = `/${belongsTo.type}/${belongsToID}/${type}`;
    mockJsonAPIClient.onGet(url).reply(200, {
      data: [makeEntityResource(type, relationships, entity)],
    });

    const result = await fetchEntitiesBelongingTo(
      type,
      getAttributes,
      relationships,
      belongsToID
    );

    const history = mockJsonAPIClient.history;
    expect(history.get.length).toBe(1);
    expect(history.get[0].url).toBe(url);
    expect(result).toStrictEqual([entity]);
  });
});

describe("createEntity", () => {
  test("creates an entity from attributes", async () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entity = randomEntity();
    const url = `/${type}`;
    mockJsonAPIClient.onPost(url).reply(200, {
      data: makeEntityResource(type, relationships, entity),
    });

    const result = await createEntity(
      type,
      getAttributes,
      relationships,
      entity.attributes
    );

    const history = mockJsonAPIClient.history;
    expect(history.post.length).toBe(1);
    expect(history.post[0].url).toBe(url);
    expect(result).toStrictEqual(entity);
  });
});

describe("createEntityBelongingTo", () => {
  test("creates an entity belonging to a parent entity", async () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entity = randomEntity();
    const belongsTo = relationships.belongsTo as EntityRelationship;
    const belongsToID = entity.relationships[belongsTo.foreignKey] as string;
    const url = `/${belongsTo.type}/${belongsToID}/${type}`;
    mockJsonAPIClient.onPost(url).reply(200, {
      data: makeEntityResource(type, relationships, entity),
    });

    const result = await createEntityBelongingTo(
      type,
      getAttributes,
      relationships,
      belongsToID,
      entity.attributes
    );

    const history = mockJsonAPIClient.history;
    expect(history.post.length).toBe(1);
    expect(history.post[0].url).toBe(url);
    expect(result).toStrictEqual(entity);
  });
});

describe("updateEntity", () => {
  test("updates an entity", async () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entity = randomEntity();
    const url = `/${type}/${entity.id}`;
    mockJsonAPIClient.onPatch(url).reply(200, {
      data: makeEntityResource(type, relationships, entity),
    });

    const result = await updateEntity(
      type,
      getAttributes,
      relationships,
      entity
    );

    const history = mockJsonAPIClient.history;
    expect(history.patch.length).toBe(1);
    expect(history.patch[0].url).toBe(url);
    expect(result).toStrictEqual(entity);
  });
});

describe("deleteEntity", () => {
  test("deletes an entity", async () => {
    const { type, relationships, randomEntity } = mockEntityType();
    const entity = randomEntity();
    const url = `/${type}/${entity.id}`;
    mockJsonAPIClient.onDelete(url).reply(200, {
      data: makeEntityResource(type, relationships, entity),
    });

    const result = await deleteEntity(type, entity);

    const history = mockJsonAPIClient.history;
    expect(history.delete.length).toBe(1);
    expect(history.delete[0].url).toBe(url);
    expect(result).toStrictEqual(entity);
  });
});
