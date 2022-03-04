import { configureStore } from "@reduxjs/toolkit";
import faker from "faker";
import Randomstring from "randomstring";
import { defaults, merge, range, values } from "lodash";
import {
  buildEntityState,
  createEntitySlice,
  emptyEntityState,
  EntityRelationship,
  EntityRelationships,
} from "./entity";
import * as datastore from "datastore";
import { EntityAttributesGetter, EntityKeys, EntityType } from "./types";
import { randomID } from "fixtures/random";
import assert from "assert";
import { mockEntityType } from "fixtures/entity";
jest.mock("datastore");

const createMockStore = <A>(
  mockEntitytype: string,
  getAttributes: EntityAttributesGetter<A>,
  mockEntityRelationships: EntityRelationships
) => {
  const { actions, reducer } = createEntitySlice(
    mockEntitytype,
    getAttributes,
    mockEntityRelationships
  );
  const store = configureStore({
    reducer: {
      [mockEntitytype]: reducer,
    },
  });
  return { actions, store };
};

function seedMockStore<A>(
  type: string,
  getEntityAttributes: EntityAttributesGetter<A>,
  relationships: EntityRelationships,
  mockEntities: EntityType<A>[]
) {
  const { actions, store } = createMockStore(
    type,
    getEntityAttributes,
    relationships
  );
  store.dispatch({
    type: `${type}/set`,
    payload: buildEntityState(mockEntities),
  });
  return { actions, store };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("buildEntityState", () => {
  test("builds empty idle state when no entities passed", () => {
    expect(buildEntityState([])).toStrictEqual({
      status: "idle",
      entities: {
        byID: {},
        allIDs: [],
      },
    });
  });

  test("builds idle state when entities passed", () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entity = randomEntity();
    expect(buildEntityState([entity])).toStrictEqual({
      status: "idle",
      entities: {
        byID: {
          [entity.id]: entity,
        },
        allIDs: [entity.id],
      },
    });
  });
});

describe("synchronous actions", () => {
  describe("set", () => {
    test("creates set action when dispatched", () => {
      const {
        type,
        getAttributes,
        relationships,
        randomEntity,
      } = mockEntityType();
      const entities = range(5).map(() => randomEntity());
      const { actions } = createEntitySlice(type, getAttributes, relationships);
      const payload = buildEntityState(entities);

      const action = actions.set(payload);

      expect(action).toStrictEqual({
        type: `${type}/set`,
        payload,
      });
    });
  });

  describe("clear", () => {
    test("creates clear action when dispatched", () => {
      const { type, getAttributes } = mockEntityType();
      const { actions } = createEntitySlice(type, getAttributes, {});

      const action = actions.clear();

      expect(action).toStrictEqual({
        type: `${type}/clear`,
        payload: undefined,
      });
    });
  });
});

describe("asynchronous thunk actions", () => {
  describe("fetch", () => {
    test("creates fetchAll/fulfilled action when dispatched", async () => {
      const {
        type,
        getAttributes,
        relationships,
        randomEntity,
      } = mockEntityType();
      const entity = randomEntity();
      const { actions, store } = seedMockStore(
        type,
        getAttributes,
        relationships,
        []
      );
      jest.spyOn(datastore, "fetchEntities").mockResolvedValue([entity]);

      const action = await store.dispatch(actions.fetchAll());

      expect(datastore.fetchEntities).toHaveBeenCalledWith(
        type,
        getAttributes,
        relationships
      );
      expect(action.type).toBe(`${type}/fetchAll/fulfilled`);
      expect(action.payload).toStrictEqual([entity]);
    });
  });

  describe("fetchAllBelongingTo", () => {
    test("creates fetchAllBelongingTo/fulfilled action when dispatched", async () => {
      const {
        type,
        getAttributes,
        relationships,
        randomEntity,
      } = mockEntityType();
      const entity = randomEntity();
      const parentEntityID = randomID();
      const { actions, store } = seedMockStore(
        type,
        getAttributes,
        relationships,
        []
      );
      jest
        .spyOn(datastore, "fetchEntitiesBelongingTo")
        .mockResolvedValue([entity]);
      assert(actions.fetchAllBelongingTo !== null);

      const action = await store.dispatch(
        actions.fetchAllBelongingTo(parentEntityID)
      );

      expect(datastore.fetchEntitiesBelongingTo).toHaveBeenCalledWith(
        type,
        getAttributes,
        relationships,
        parentEntityID
      );
      expect(action.type).toBe(`${type}/fetchAllBelongingTo/fulfilled`);
      expect(action.payload).toStrictEqual([entity]);
    });
  });

  describe("add", () => {
    test("creates add/fulfilled action when dispatched", async () => {
      const {
        type,
        getAttributes,
        relationships,
        randomEntity,
      } = mockEntityType();
      const entity = randomEntity();
      const { actions, store } = seedMockStore(
        type,
        getAttributes,
        relationships,
        []
      );
      jest.spyOn(datastore, "createEntity").mockResolvedValue(entity);

      const action = await store.dispatch(
        actions.add({
          title: entity.attributes.title,
        })
      );

      expect(datastore.createEntity).toHaveBeenCalledWith(
        type,
        getAttributes,
        relationships,
        {
          title: entity.attributes.title,
        }
      );
      expect(action.type).toBe(`${type}/add/fulfilled`);
      expect(action.payload).toStrictEqual(entity);
    });
  });

  describe("addBelongingTo", () => {
    test("creates addBelongingTo/fulfilled action when dispatched", async () => {
      const {
        type,
        getAttributes,
        relationships,
        randomEntity,
      } = mockEntityType();
      const entity = randomEntity();
      const parentEntityID = randomID();
      const { actions, store } = seedMockStore(
        type,
        getAttributes,
        relationships,
        []
      );
      jest
        .spyOn(datastore, "createEntityBelongingTo")
        .mockResolvedValue(entity);
      assert(actions.addBelongingTo !== null);

      const action = await store.dispatch(
        actions.addBelongingTo({
          attributes: {
            title: entity.attributes.title,
          },
          belongsToID: parentEntityID,
        })
      );

      expect(datastore.createEntityBelongingTo).toHaveBeenCalledWith(
        type,
        getAttributes,
        relationships,
        parentEntityID,
        {
          title: entity.attributes.title,
        }
      );
      expect(action.type).toBe(`${type}/addBelongingTo/fulfilled`);
      expect(action.payload).toStrictEqual(entity);
    });
  });

  describe("update", () => {
    test("creates update/fulfilled action when dispatched", async () => {
      const {
        type,
        getAttributes,
        relationships,
        randomEntity,
      } = mockEntityType();
      const entity = randomEntity();
      const { actions, store } = seedMockStore(
        type,
        getAttributes,
        relationships,
        []
      );
      jest.spyOn(datastore, "updateEntity").mockResolvedValue(entity);

      const action = await store.dispatch(actions.update(entity));

      expect(datastore.updateEntity).toHaveBeenCalledWith(
        type,
        getAttributes,
        relationships,
        entity
      );
      expect(action.type).toBe(`${type}/update/fulfilled`);
      expect(action.payload).toBe(entity);
    });
  });

  describe("delete", () => {
    test("creates delete/fulfilled action when dispatched", async () => {
      const {
        type,
        getAttributes,
        relationships,
        randomEntity,
      } = mockEntityType();
      const entity = randomEntity();
      const { actions, store } = seedMockStore(
        type,
        getAttributes,
        relationships,
        []
      );
      jest.spyOn(datastore, "deleteEntity").mockResolvedValue(entity);

      const action = await store.dispatch(actions.delete(entity));

      expect(datastore.deleteEntity).toHaveBeenCalledWith(type, entity);
      expect(action.type).toBe(`${type}/delete/fulfilled`);
      expect(action.payload).toBe(entity);
    });
  });
});

describe("reducer", () => {
  test("populate store when set action is dispatched", () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entities = range(5).map(() => randomEntity());
    const { store } = seedMockStore(type, getAttributes, relationships, []);
    expect(store.getState()[type]).toStrictEqual(emptyEntityState());
    const entityState = buildEntityState(entities);

    store.dispatch({
      type: `${type}/set`,
      payload: entityState,
    });

    expect(store.getState()[type]).toStrictEqual(entityState);
  });

  test("clear store when clear action is dispatched", () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entities = range(5).map(() => randomEntity());
    const { store } = seedMockStore(
      type,
      getAttributes,
      relationships,
      entities
    );
    expect(store.getState()[type]).not.toStrictEqual(emptyEntityState());

    store.dispatch({
      type: `${type}/clear`,
    });

    expect(store.getState()[type]).toStrictEqual(emptyEntityState());
  });

  test("populate store when fetch action is dispatched", () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entities = range(5).map(() => randomEntity());
    const { store } = seedMockStore(type, getAttributes, relationships, []);
    expect(store.getState()[type]).toStrictEqual(emptyEntityState());
    const entityState = buildEntityState(entities);

    store.dispatch({
      type: `${type}/fetchAll/fulfilled`,
      payload: entities,
    });

    expect(store.getState()[type]).toStrictEqual(entityState);
  });

  test("populate store when fetchAllBelongingTo action is dispatched", () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entities = range(5).map(() => randomEntity());
    const { store } = seedMockStore(type, getAttributes, relationships, []);
    expect(store.getState()[type]).toStrictEqual(emptyEntityState());
    const entityState = buildEntityState(entities);

    store.dispatch({
      type: `${type}/fetchAllBelongingTo/fulfilled`,
      payload: entities,
    });

    expect(store.getState()[type]).toStrictEqual(entityState);
  });

  test("add entity to store when add action is dispatched", async () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entity = randomEntity();
    const { store } = seedMockStore(type, getAttributes, relationships, []);
    expect(store.getState()[type]).toStrictEqual(emptyEntityState());

    store.dispatch({
      type: `${type}/add/fulfilled`,
      payload: entity,
    });

    const { entities } = store.getState()[type];
    expect(entities.allIDs).toStrictEqual([entity.id]);
  });

  test("update entity in store when update action is dispatched", async () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entity = randomEntity();
    const { store } = seedMockStore(type, getAttributes, relationships, [
      entity,
    ]);
    const updatedAttributes = merge(entity.attributes, {
      title: faker.random.words(3),
    });
    const updatedEntity = merge(entity, {
      attributes: updatedAttributes,
    });

    store.dispatch({
      type: `${type}/update/fulfilled`,
      payload: updatedEntity,
    });

    const { entities } = store.getState()[type];
    expect(entities.byID[entity.id]).toStrictEqual(entity);
  });

  test("delete entity from store when delete action is dispatched", async () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const entity = randomEntity();
    const { store } = seedMockStore(type, getAttributes, relationships, [
      entity,
    ]);

    store.dispatch({
      type: `${type}/delete/fulfilled`,
      payload: entity,
    });

    const { entities } = store.getState()[type];
    expect(entities.byID[entity.id]).toBeUndefined();
    expect(entities.allIDs).toHaveLength(0);
  });

  test("delete all entities when clear action is dispatched for owner entity", () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    assert(relationships.belongsTo !== undefined);
    const belongsToType = relationships.belongsTo.type;
    const belongsToKey = relationships.belongsTo.foreignKey;
    const owner1ID = randomID();
    const ownee1 = randomEntity();
    const owner2ID = randomID();
    const ownee2 = randomEntity();
    ownee1.relationships[belongsToKey] = [owner1ID];
    ownee2.relationships[belongsToKey] = [owner2ID];
    const { store } = seedMockStore(type, getAttributes, relationships, [
      ownee1,
      ownee2,
    ]);

    store.dispatch({
      type: `${belongsToType}/clear`,
    });

    const { entities } = store.getState()[type];
    expect(entities.byID).toStrictEqual({});
    expect(entities.allIDs).toStrictEqual([]);
  });

  test("delete entity when delete action is dispatched for owner entity", () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    assert(relationships.belongsTo !== undefined);
    const belongsToType = relationships.belongsTo.type;
    const belongsToKey = relationships.belongsTo.foreignKey;
    const belongsToBPKey = relationships.belongsTo.backPopulates;
    const owner1ID = randomID();
    const ownee1 = randomEntity();
    const owner2ID = randomID();
    const ownee2 = randomEntity();
    ownee1.relationships[belongsToKey] = [owner1ID];
    ownee2.relationships[belongsToKey] = [owner2ID];
    const { store } = seedMockStore(type, getAttributes, relationships, [
      ownee1,
      ownee2,
    ]);

    store.dispatch({
      type: `${belongsToType}/delete/fulfilled`,
      payload: {
        id: owner1ID,
        relationships: {
          [belongsToBPKey]: [ownee1.id],
        },
      },
    });

    const { entities } = store.getState()[type];
    expect(entities.byID).toStrictEqual({
      [ownee2.id]: ownee2,
    });
    expect(entities.allIDs).toStrictEqual([ownee2.id]);
  });

  test("add ownee keys when set action is dispatched for ownee entity", () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    assert(relationships.hasMany !== undefined);
    const hasManyType = relationships.hasMany[0].type;
    const hasManyKey = relationships.hasMany[0].foreignKey;
    const hasManyBPKey = relationships.hasMany[0].backPopulates;
    const ownee1ID = randomID();
    const owner1 = randomEntity();
    const ownee2ID = randomID();
    const owner2 = randomEntity();
    const { store } = seedMockStore(type, getAttributes, relationships, [
      owner1,
      owner2,
    ]);

    store.dispatch({
      type: `${hasManyType}/set`,
      payload: buildEntityState([
        {
          id: ownee1ID,
          created: "",
          changed: "",
          relationships: {
            [hasManyBPKey]: owner1.id,
          },
        },
        {
          id: ownee2ID,
          created: "",
          changed: "",
          relationships: {
            [hasManyBPKey]: owner2.id,
          },
        },
      ]),
    });

    const { entities } = store.getState()[type];
    expect(entities.byID[owner1.id].relationships[hasManyKey]).toStrictEqual([
      ownee1ID,
    ]);
    expect(entities.byID[owner2.id].relationships[hasManyKey]).toStrictEqual([
      ownee2ID,
    ]);
  });

  test("add ownee key when add action is dispatched for ownee entity", () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    assert(relationships.hasMany !== undefined);
    const hasManyType = relationships.hasMany[0].type;
    const hasManyKey = relationships.hasMany[0].foreignKey;
    const hasManyBPKey = relationships.hasMany[0].backPopulates;
    const ownee1ID = randomID();
    const owner1 = randomEntity();
    const owner2 = randomEntity();
    const { store } = seedMockStore(type, getAttributes, relationships, [
      owner1,
      owner2,
    ]);

    store.dispatch({
      type: `${hasManyType}/add/fulfilled`,
      payload: {
        id: ownee1ID,
        created: "",
        changed: "",
        relationships: {
          [hasManyBPKey]: owner1.id,
        },
      },
    });

    const { entities } = store.getState()[type];
    expect(entities.byID[owner1.id].relationships[hasManyKey]).toStrictEqual([
      ownee1ID,
    ]);
    expect(entities.byID[owner2.id].relationships[hasManyKey]).toStrictEqual(
      []
    );
  });

  test("delete all ownee keys when clear action is dispatched for ownee entity", async () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    assert(relationships.hasMany !== undefined);
    const hasManyType = relationships.hasMany[0].type;
    const hasManyKey = relationships.hasMany[0].foreignKey;
    const ownee1ID = randomID();
    const owner1 = randomEntity();
    const ownee2ID = randomID();
    const owner2 = randomEntity();
    owner1.relationships[hasManyKey] = [ownee1ID];
    owner2.relationships[hasManyKey] = [ownee2ID];
    const { store } = seedMockStore(type, getAttributes, relationships, [
      owner1,
      owner2,
    ]);

    store.dispatch({
      type: `${hasManyType}/clear`,
    });

    const { entities } = store.getState()[type];
    expect(entities.byID[owner1.id].relationships[hasManyKey]).toStrictEqual(
      []
    );
    expect(entities.byID[owner2.id].relationships[hasManyKey]).toStrictEqual(
      []
    );
  });

  test("delete ownee key when delete action is dispatched for ownee entity", async () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    assert(relationships.hasMany !== undefined);
    const hasManyType = relationships.hasMany[0].type;
    const hasManyKey = relationships.hasMany[0].foreignKey;
    const hasManyBPKey = relationships.hasMany[0].backPopulates;
    const ownee1ID = randomID();
    const owner1 = randomEntity();
    const ownee2ID = randomID();
    const owner2 = randomEntity();
    owner1.relationships[hasManyKey] = [ownee1ID];
    owner2.relationships[hasManyKey] = [ownee2ID];
    const { store } = seedMockStore(type, getAttributes, relationships, [
      owner1,
      owner2,
    ]);

    store.dispatch({
      type: `${hasManyType}/delete/fulfilled`,
      payload: {
        id: ownee1ID,
        relationships: {
          [hasManyBPKey]: owner1.id,
        },
      },
    });

    const { entities } = store.getState()[type];
    expect(entities.byID[owner1.id].relationships[hasManyKey]).toStrictEqual(
      []
    );
    expect(entities.byID[owner2.id].relationships[hasManyKey]).toStrictEqual([
      ownee2ID,
    ]);
  });
});
