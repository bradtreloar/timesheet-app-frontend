import { jsonAPIClient } from "datastore/clients";
import MockAdapter from "axios-mock-adapter";
import { randomDateTime, randomID } from "fixtures/random";
import * as datastore from "datastore";
import {
  UnauthenticatedEntityRequestException,
  UnauthorizedEntityRequestException,
  createEntity,
  createEntityBelongingTo,
  deleteEntity,
  EntityNotFoundException,
  fetchEntities,
  fetchEntitiesBelongingTo,
  fetchEntity,
  updateEntity,
} from "datastore/entity";
import { mockEntityType } from "fixtures/entity";
import { makeEntityResource } from "./adapters";

const mockJsonAPIClient = new MockAdapter(jsonAPIClient);

beforeEach(() => {
  jest.spyOn(datastore, "getCSRFCookie");
});

afterEach(() => {
  jest.resetAllMocks();
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
    mockJsonAPIClient.onGet(url).replyOnce(200, {
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

  function testException(status: number, expectedError: any) {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entity = randomEntity();
    const url = `/${type}/${entity.id}`;
    mockJsonAPIClient.onGet(url).replyOnce(status);

    expect(
      fetchEntity(type, entity.id, getAttributes, relationships)
    ).rejects.toThrow(expectedError);
  }

  test("rejects with UnauthenticatedEntityRequestException when error 401", () => {
    testException(401, UnauthenticatedEntityRequestException);
  });

  test("rejects with UnauthorizedEntityRequestException when error 403", () => {
    testException(403, UnauthorizedEntityRequestException);
  });

  test("rejects with EntityNotFoundException when error 404", async () => {
    testException(404, EntityNotFoundException);
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
    mockJsonAPIClient.onGet(url).replyOnce(200, {
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
      .replyOnce(200, {
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
    const belongsTo = relationships.belongsTo;
    const ownerID = entity.relationships[belongsTo.foreignKey] as string;
    const url = `/${belongsTo.type}/${ownerID}/${type}`;
    mockJsonAPIClient.onGet(url).replyOnce(200, {
      data: [makeEntityResource(type, relationships, entity)],
    });

    const result = await fetchEntitiesBelongingTo(
      type,
      getAttributes,
      relationships,
      ownerID
    );

    const history = mockJsonAPIClient.history;
    expect(history.get.length).toBe(1);
    expect(history.get[0].url).toBe(url);
    expect(result).toStrictEqual([entity]);
  });

  function testException(status: number, expectedError: any) {
    const { type, getAttributes, relationships } = mockEntityType();
    const ownerType = relationships.belongsTo.type;
    const ownerID = randomID();
    const url = `/${ownerType}/${ownerID}/${type}`;
    mockJsonAPIClient.onGet(url).replyOnce(status);

    expect(
      fetchEntitiesBelongingTo(type, getAttributes, relationships, ownerID)
    ).rejects.toThrow(expectedError);
  }

  test("rejects with UnauthenticatedEntityRequestException when error 401", () => {
    testException(401, UnauthenticatedEntityRequestException);
  });

  test("rejects with UnauthorizedEntityRequestException when error 403", async () => {
    testException(403, UnauthorizedEntityRequestException);
  });

  test("rejects with EntityNotFoundException when error 404", async () => {
    testException(404, EntityNotFoundException);
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
    mockJsonAPIClient.onPost(url).replyOnce(200, {
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
    const belongsTo = relationships.belongsTo;
    const ownerID = entity.relationships[belongsTo.foreignKey] as string;
    const url = `/${belongsTo.type}/${ownerID}/${type}`;
    mockJsonAPIClient.onPost(url).replyOnce(200, {
      data: makeEntityResource(type, relationships, entity),
    });

    const result = await createEntityBelongingTo(
      type,
      getAttributes,
      relationships,
      ownerID,
      entity.attributes
    );

    const history = mockJsonAPIClient.history;
    expect(history.post.length).toBe(1);
    expect(history.post[0].url).toBe(url);
    expect(result).toStrictEqual(entity);
  });

  function testException(status: number, expectedError: any) {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entity = randomEntity();
    const belongsTo = relationships.belongsTo;
    const ownerID = entity.relationships[belongsTo.foreignKey] as string;
    const url = `/${belongsTo.type}/${ownerID}/${type}`;
    mockJsonAPIClient.onPost(url).replyOnce(status);

    expect(
      createEntityBelongingTo(
        type,
        getAttributes,
        relationships,
        ownerID,
        entity.attributes
      )
    ).rejects.toThrow(expectedError);
  }

  test("rejects with UnauthenticatedEntityRequestException when error 401", () => {
    testException(401, UnauthenticatedEntityRequestException);
  });

  test("rejects with UnauthorizedEntityRequestException when error 403", async () => {
    testException(403, UnauthorizedEntityRequestException);
  });

  test("rejects with EntityNotFoundException when error 404", async () => {
    testException(404, EntityNotFoundException);
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
    mockJsonAPIClient.onPatch(url).replyOnce(200, {
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

  function testException(status: number, expectedError: any) {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entity = randomEntity();
    const url = `/${type}/${entity.id}`;
    mockJsonAPIClient.onPost(url).replyOnce(status);

    expect(
      updateEntity(type, getAttributes, relationships, entity)
    ).rejects.toThrow(expectedError);
  }

  test("rejects with UnauthenticatedEntityRequestException when error 401", () => {
    testException(401, UnauthenticatedEntityRequestException);
  });

  test("rejects with UnauthorizedEntityRequestException when error 403", async () => {
    testException(403, UnauthorizedEntityRequestException);
  });

  test("rejects with EntityNotFoundException when error 404", async () => {
    testException(404, EntityNotFoundException);
  });
});

describe("deleteEntity", () => {
  test("deletes an entity", async () => {
    const { type, relationships, randomEntity } = mockEntityType();
    const entity = randomEntity();
    const url = `/${type}/${entity.id}`;
    mockJsonAPIClient.onDelete(url).replyOnce(200, {
      data: makeEntityResource(type, relationships, entity),
    });

    const result = await deleteEntity(type, entity);

    const history = mockJsonAPIClient.history;
    expect(history.delete.length).toBe(1);
    expect(history.delete[0].url).toBe(url);
    expect(result).toStrictEqual(entity);
  });

  function testException(status: number, expectedError: any) {
    const { type, randomEntity } = mockEntityType();
    const entity = randomEntity();
    const url = `/${type}/${entity.id}`;
    mockJsonAPIClient.onDelete(url).replyOnce(status);

    expect(deleteEntity(type, entity)).rejects.toThrow(expectedError);
  }

  test("rejects with UnauthenticatedEntityRequestException when error 401", () => {
    testException(401, UnauthenticatedEntityRequestException);
  });

  test("rejects with UnauthorizedEntityRequestException when error 403", async () => {
    testException(403, UnauthorizedEntityRequestException);
  });

  test("rejects with EntityNotFoundException when error 404", async () => {
    testException(404, EntityNotFoundException);
  });
});
