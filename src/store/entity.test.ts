import { configureStore } from "@reduxjs/toolkit";
import faker from "faker";
import { merge, range } from "lodash";
import {
  buildEntityState,
  createEntitySlice,
  emptyEntityState,
} from "./entity";
import * as entityDatastore from "datastore/entity";
import {
  Entity,
  EntityAttributes,
  EntityAttributesGetter,
  EntityKeys,
  EntityRelationships,
  RejectedAction,
} from "./types";
import { randomID } from "fixtures/random";
import assert from "assert";
import { mockEntityType } from "fixtures/entity";

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

function seedMockStore<A extends EntityAttributes, K extends EntityKeys>(
  type: string,
  getEntityAttributes: EntityAttributesGetter<A>,
  relationships: EntityRelationships,
  mockEntities: Entity<A, K>[]
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
      error: null,
    });
  });

  test("builds idle state when entities passed", () => {
    const { randomEntity } = mockEntityType();
    const entity = randomEntity();
    expect(buildEntityState([entity])).toStrictEqual({
      status: "idle",
      entities: {
        byID: {
          [entity.id]: entity,
        },
        allIDs: [entity.id],
      },
      error: null,
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
  describe("fetchOne", () => {
    test("creates fetchOne/fulfilled action when dispatched", async () => {
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
      jest.spyOn(entityDatastore, "fetchEntity").mockResolvedValue(entity);

      const action = await store.dispatch(actions.fetchOne(entity.id));

      expect(entityDatastore.fetchEntity).toHaveBeenCalledWith(
        type,
        entity.id,
        getAttributes,
        relationships
      );
      expect(action.type).toBe(`${type}/fetchOne/fulfilled`);
      expect(action.payload).toStrictEqual(entity);
    });

    test(`rejects with EntityNotFoundException error`, async () => {
      const id = faker.random.uuid();
      const {
        type,
        getAttributes,
        relationships,
        randomEntity,
      } = mockEntityType();
      const { actions, store } = seedMockStore(
        type,
        getAttributes,
        relationships,
        []
      );
      jest
        .spyOn(entityDatastore, "fetchEntity")
        .mockRejectedValue(
          new entityDatastore.EntityNotFoundException(type, id)
        );

      const action = (await store.dispatch(
        actions.fetchOne(id)
      )) as RejectedAction;

      expect(entityDatastore.fetchEntity).toHaveBeenCalledWith(
        type,
        id,
        getAttributes,
        relationships
      );
      expect(action.type).toBe(`${type}/fetchOne/rejected`);
      expect(action.error.name).toBe("EntityNotFoundException");
      expect(action.error.message).toBe(`Not found: ${type}/${id}`);
    });
  });

  describe("fetchAll", () => {
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
      jest.spyOn(entityDatastore, "fetchEntities").mockResolvedValue([entity]);

      const action = await store.dispatch(actions.fetchAll());

      expect(entityDatastore.fetchEntities).toHaveBeenCalledWith(
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
        .spyOn(entityDatastore, "fetchEntitiesBelongingTo")
        .mockResolvedValue([entity]);
      assert(actions.fetchAllBelongingTo !== null);

      const action = await store.dispatch(
        actions.fetchAllBelongingTo(parentEntityID)
      );

      expect(entityDatastore.fetchEntitiesBelongingTo).toHaveBeenCalledWith(
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
      jest.spyOn(entityDatastore, "createEntity").mockResolvedValue(entity);

      const action = await store.dispatch(
        actions.add({
          title: entity.attributes.title,
        })
      );

      expect(entityDatastore.createEntity).toHaveBeenCalledWith(
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
        .spyOn(entityDatastore, "createEntityBelongingTo")
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

      expect(entityDatastore.createEntityBelongingTo).toHaveBeenCalledWith(
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
      jest.spyOn(entityDatastore, "updateEntity").mockResolvedValue(entity);

      const action = await store.dispatch(actions.update(entity));

      expect(entityDatastore.updateEntity).toHaveBeenCalledWith(
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
      jest.spyOn(entityDatastore, "deleteEntity").mockResolvedValue(entity);

      const action = await store.dispatch(actions.delete(entity));

      expect(entityDatastore.deleteEntity).toHaveBeenCalledWith(type, entity);
      expect(action.type).toBe(`${type}/delete/fulfilled`);
      expect(action.payload).toBe(entity);
    });
  });
});

describe("reducer", () => {
  describe("<type>/set", () => {
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
  });

  describe("<type>/clear", () => {
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
  });

  describe("<type>/fetchOne", () => {
    test("add entity to store when action type is fulfilled", () => {
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
        type: `${type}/fetchOne/fulfilled`,
        payload: entity,
      });

      expect(store.getState()[type]).toStrictEqual(buildEntityState([entity]));
    });

    test("update entity in store when action type is fulfilled", () => {
      const {
        type,
        getAttributes,
        relationships,
        randomEntity,
      } = mockEntityType();
      const entity = randomEntity();
      const updatedEntity = merge(entity, {
        attributes: {
          ...entity.attributes,
          title: faker.random.word(),
        },
      });
      const { store } = seedMockStore(type, getAttributes, relationships, [
        entity,
      ]);

      store.dispatch({
        type: `${type}/fetchOne/fulfilled`,
        payload: entity,
      });

      expect(store.getState()[type]).toStrictEqual(
        buildEntityState([updatedEntity])
      );
    });
  });

  describe("<type>/fetchAll", () => {
    test("add/update entities to store when action type is fulfilled", () => {
      const {
        type,
        getAttributes,
        relationships,
        randomEntity,
      } = mockEntityType();
      const entities = range(5).map(() => randomEntity());
      const newEntity = randomEntity();
      const { store } = seedMockStore(
        type,
        getAttributes,
        relationships,
        entities
      );

      store.dispatch({
        type: `${type}/fetchAll/fulfilled`,
        payload: [...entities, newEntity],
      });

      expect(store.getState()[type]).toStrictEqual(
        buildEntityState([...entities, newEntity])
      );
    });
  });

  describe("<type>/fetchAllBelongingTo", () => {
    test("populate store when action type is fulfilled", () => {
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
  });

  describe("<type>/add", () => {
    test("add entity to store when action type is fulfilled", async () => {
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
  });

  describe("<type>/update", () => {
    test("update entity in store action type is fulfilled", async () => {
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
  });

  describe("<type>/delete", () => {
    test("delete entity from store when action type is fulfilled", async () => {
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
  });

  describe("<owner-type>/clear", () => {
    test("delete all entities when owners are deleted", () => {
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
  });

  describe("<owner-type>/delete", () => {
    test("delete entities belonging to deleted owner", () => {
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
  });

  describe("<ownee-type>/set", () => {
    test("add ownee keys", () => {
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
            attributes: {},
            relationships: {
              [hasManyBPKey]: owner1.id,
            },
          },
          {
            id: ownee2ID,
            created: "",
            changed: "",
            attributes: {},
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
  });

  describe("<ownee-type>/add", () => {
    test("add ownee key", () => {
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
  });

  describe("<ownee-type>/clear", () => {
    test("delete all ownee keys", async () => {
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
  });

  describe("<ownee-type>/delete", () => {
    test("delete ownee key", async () => {
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
});
