import {
  ActionReducerMapBuilder,
  createAsyncThunk,
  createSlice,
  Draft,
  isPending,
  isRejected,
  PayloadAction,
} from "@reduxjs/toolkit";
import {
  createEntity,
  createEntityBelongingTo,
  deleteEntity,
  fetchEntities,
  fetchEntitiesBelongingTo,
  fetchEntity,
  updateEntity,
} from "datastore/entity";
import {
  Entity,
  EntityAttributes,
  EntityAttributesGetter,
  EntityBase,
  EntityKeys,
  EntityRelationships,
  EntityState,
  EntityStateData,
} from "./types";

export const emptyEntityState = <T>() =>
  ({
    entities: {
      byID: {},
      allIDs: [],
    },
    status: "idle",
    error: null,
  } as EntityState<T>);

export const buildEntityState = <
  A extends EntityAttributes,
  K extends EntityKeys
>(
  entities: Entity<A, K>[]
) =>
  entities.reduce((entityState, entity) => {
    entityState.entities.byID[entity.id] = entity;
    entityState.entities.allIDs.push(entity.id);
    return entityState;
  }, emptyEntityState<Entity<A, K>>());

export const createEntitySlice = <
  T extends string,
  A extends EntityAttributes,
  K extends EntityKeys
>(
  type: T,
  getAttributes: EntityAttributesGetter<A>,
  relationships: EntityRelationships,
  extraReducers?: (
    builder: ActionReducerMapBuilder<EntityState<Entity<A, K>>>
  ) => void
) => {
  const asyncActions = createAsyncEntityActions<A, K, T>(
    type,
    getAttributes,
    relationships
  );

  const slice = createSlice({
    name: type,
    initialState: emptyEntityState<Entity<A, K>>(),
    reducers: {
      clear() {
        return emptyEntityState<Entity<A, K>>();
      },
      set(state, action: PayloadAction<EntityState<Entity<A, K>>>) {
        return action.payload;
      },
    },
    extraReducers: (builder) => {
      if (extraReducers) {
        extraReducers(builder);
      }

      builder.addCase(asyncActions.fetchOne.fulfilled, (state, action) => {
        const entity = action.payload;
        const allIDs = state.entities.allIDs;
        if (!allIDs.includes(entity.id)) {
          allIDs.push(entity.id);
        }
        state.entities.byID[entity.id] = entity as Draft<Entity<A, K>>;
      });

      builder.addCase(asyncActions.fetchAll.fulfilled, (state, action) => {
        const entities = action.payload;
        const allIDs = state.entities.allIDs;
        entities.forEach((entity) => {
          if (!allIDs.includes(entity.id)) {
            allIDs.push(entity.id);
          }
          state.entities.byID[entity.id] = entity as Draft<Entity<A, K>>;
        });
      });

      if (asyncActions.fetchAllBelongingTo !== null) {
        builder.addCase(
          asyncActions.fetchAllBelongingTo.fulfilled,
          (state, action) => {
            const entities = action.payload;
            const allIDs = state.entities.allIDs;
            entities.forEach((entity) => {
              if (!allIDs.includes(entity.id)) {
                allIDs.push(entity.id);
              }
              state.entities.byID[entity.id] = entity as Draft<Entity<A, K>>;
            });
          }
        );
      }

      builder.addCase(asyncActions.add.fulfilled, (state, action) => {
        const entity = action.payload;
        state.entities.byID[entity.id] = entity as Draft<Entity<A, K>>;
        state.entities.allIDs.push(entity.id);
      });

      if (asyncActions.addBelongingTo !== null) {
        builder.addCase(
          asyncActions.addBelongingTo.fulfilled,
          (state, action) => {
            const entity = action.payload;
            state.entities.byID[entity.id] = entity as Draft<Entity<A, K>>;
            state.entities.allIDs.push(entity.id);
          }
        );
      }

      builder.addCase(asyncActions.update.fulfilled, (state, action) => {
        const entity = action.payload;
        state.entities.byID[entity.id] = entity as Draft<Entity<A, K>>;
      });

      builder.addCase(asyncActions.delete.fulfilled, (state, action) => {
        const entity = action.payload;
        delete state.entities.byID[entity.id];
        const allIDs = state.entities.allIDs;
        state.entities.allIDs = allIDs.filter((id) => id !== entity.id);
      });

      if (relationships.belongsTo) {
        const { type: belongsToType, backPopulates } = relationships.belongsTo;

        builder.addCase(`${belongsToType}/clear`, (state) => {
          return emptyEntityState<Entity<A, K>>();
        });

        builder.addCase<string, PayloadAction<EntityBase>>(
          `${belongsToType}/delete/fulfilled`,
          (state, action) => {
            const ownerEntity = action.payload;
            const deletedIDs = ownerEntity.relationships[
              backPopulates
            ] as string[];

            deletedIDs.forEach((id) => {
              delete state.entities.byID[id];
            });

            state.entities.allIDs = state.entities.allIDs.filter(
              (id) => !deletedIDs.includes(id)
            );
          }
        );
      }

      if (relationships.hasMany) {
        for (let {
          type: hasManyType,
          foreignKey,
          backPopulates: backPopKey,
        } of relationships.hasMany) {
          builder.addCase<string, PayloadAction<EntityState<EntityBase>>>(
            `${hasManyType}/set`,
            (state, action) => {
              const owneeEntityState = action.payload;
              const { entities } = owneeEntityState;
              for (let owneeEntityID of entities.allIDs) {
                const owneeEntity = entities.byID[owneeEntityID];
                const ownerID = owneeEntity.relationships[backPopKey] as string;
                const ownerEntity = state.entities.byID[ownerID];
                if (ownerEntity !== undefined) {
                  const keys = ownerEntity.relationships[
                    foreignKey
                  ] as string[];
                  keys.push(owneeEntityID);
                }
              }
            }
          );

          builder.addCase<string, PayloadAction<EntityStateData<EntityBase>>>(
            `${hasManyType}/clear`,
            (state, action) => {
              for (let id of state.entities.allIDs) {
                const keys = state.entities.byID[id].relationships;
                keys[
                  foreignKey as keyof Draft<K>
                ] = ([] as unknown) as Draft<K>[keyof Draft<K>];
              }
            }
          );

          builder.addCase<string, PayloadAction<EntityBase>>(
            `${hasManyType}/add/fulfilled`,
            (state, action) => {
              const owneeEntity = action.payload;
              const ownerID = owneeEntity.relationships[backPopKey] as string;
              const ownerEntity = state.entities.byID[ownerID];
              const keys = ownerEntity.relationships[foreignKey] as string[];
              keys.push(owneeEntity.id);
            }
          );

          builder.addCase<string, PayloadAction<EntityBase>>(
            `${hasManyType}/delete/fulfilled`,
            (state, action) => {
              const owneeEntity = action.payload;
              const ownerID = owneeEntity.relationships[backPopKey] as string;
              const ownerEntity = state.entities.byID[ownerID];
              const owneeIDs = ownerEntity.relationships[
                foreignKey
              ] as string[];
              const keys = ownerEntity.relationships;
              keys[foreignKey as keyof Draft<K>] = owneeIDs.filter(
                (id) => id !== owneeEntity.id
              ) as Draft<K>[keyof Draft<K>];
            }
          );
        }
      }

      builder
        .addMatcher(isPending, (state) => {
          state.status = "pending";
          state.error = null;
        })
        .addMatcher(isRejected, (state, action) => {
          state.status = "rejected";
          state.error = action.error;
        });
    },
  });

  return {
    ...slice,
    actions: {
      ...slice.actions,
      ...asyncActions,
    },
  };
};

export const createAsyncEntityActions = <
  A extends EntityAttributes,
  K extends EntityKeys,
  T extends string
>(
  entityType: T,
  attributesGetter: EntityAttributesGetter<A>,
  relationships: EntityRelationships
) => {
  const belongsTo = relationships.belongsTo;

  return {
    fetchOne: createAsyncThunk(
      `${entityType}/fetchOne`,
      async (id: string) =>
        await fetchEntity<T, A, K>(
          entityType,
          id,
          attributesGetter,
          relationships
        )
    ),
    fetchAll: createAsyncThunk(
      `${entityType}/fetchAll`,
      async () =>
        await fetchEntities<T, A, K>(
          entityType,
          attributesGetter,
          relationships
        )
    ),
    fetchAllBelongingTo:
      belongsTo !== undefined
        ? createAsyncThunk(
            `${entityType}/fetchAllBelongingTo`,
            async (belongsToID: string) =>
              await fetchEntitiesBelongingTo<T, A, K>(
                entityType,
                attributesGetter,
                relationships,
                belongsToID
              )
          )
        : null,
    add: createAsyncThunk(
      `${entityType}/add`,
      async (attributes: A) =>
        await createEntity(
          entityType,
          attributesGetter,
          relationships,
          attributes
        )
    ),
    addBelongingTo:
      belongsTo !== undefined
        ? createAsyncThunk(
            `${entityType}/addBelongingTo`,
            async ({
              attributes,
              belongsToID,
            }: {
              attributes: A;
              belongsToID: string;
            }) =>
              await createEntityBelongingTo<T, A, K>(
                entityType,
                attributesGetter,
                relationships,
                belongsToID,
                attributes
              )
          )
        : null,
    update: createAsyncThunk(
      `${entityType}/update`,
      async (entity: Entity<A, K>) =>
        await updateEntity(entityType, attributesGetter, relationships, entity)
    ),
    delete: createAsyncThunk(
      `${entityType}/delete`,
      async (entity: Entity<A, K>) => await deleteEntity(entityType, entity)
    ),
  };
};
