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
  updateEntity,
} from "datastore";
import {
  Entity,
  EntityAttributesGetter,
  EntityState,
  EntityStateData,
  EntityType,
} from "./types";

export interface EntityRelationship {
  type: string;
  foreignKey: string;
  backPopulates: string;
}

export type EntityRelationships = {
  belongsTo?: EntityRelationship;
  hasMany?: EntityRelationship[];
};

export const emptyEntityState = <T>() =>
  ({
    entities: {
      byID: {},
      allIDs: [],
    },
    status: "idle",
  } as EntityState<T>);

export const buildEntityState = <T extends Entity>(entities: T[]) =>
  entities.reduce((entityState, entity) => {
    entityState.entities.byID[entity.id] = entity;
    entityState.entities.allIDs.push(entity.id);
    return entityState;
  }, emptyEntityState<T>());

export const createEntitySlice = <
  T extends string,
  A extends Record<string, any>
>(
  type: T,
  getAttributes: EntityAttributesGetter<A>,
  relationships: EntityRelationships,
  extraReducers?: (
    builder: ActionReducerMapBuilder<EntityState<EntityType<A>>>
  ) => void
) => {
  const asyncActions = createAsyncEntityActions<A, T>(
    type,
    getAttributes,
    relationships
  );

  const slice = createSlice({
    name: type,
    initialState: emptyEntityState<EntityType<A>>(),
    reducers: {
      clear() {
        return emptyEntityState<EntityType<A>>();
      },
      set(state, action: PayloadAction<EntityState<EntityType<A>>>) {
        return action.payload;
      },
    },
    extraReducers: (builder) => {
      if (extraReducers) {
        extraReducers(builder);
      }

      builder.addCase(asyncActions.fetch.fulfilled, (state, action) => {
        const entities = action.payload;
        const allIDs = state.entities.allIDs;
        entities.forEach((entity) => {
          if (!allIDs.includes(entity.id)) {
            allIDs.push(entity.id);
          }
          state.entities.byID[entity.id] = entity as Draft<EntityType<A>>;
        });
      });

      if (asyncActions.fetchBelongingTo !== null) {
        builder.addCase(
          asyncActions.fetchBelongingTo.fulfilled,
          (state, action) => {
            const entities = action.payload;
            const allIDs = state.entities.allIDs;
            entities.forEach((entity) => {
              if (!allIDs.includes(entity.id)) {
                allIDs.push(entity.id);
              }
              state.entities.byID[entity.id] = entity as Draft<EntityType<A>>;
            });
          }
        );
      }

      builder.addCase(asyncActions.add.fulfilled, (state, action) => {
        const entity = action.payload;
        state.entities.byID[entity.id] = entity as Draft<EntityType<A>>;
        state.entities.allIDs.push(entity.id);
      });

      if (asyncActions.addBelongingTo !== null) {
        builder.addCase(
          asyncActions.addBelongingTo.fulfilled,
          (state, action) => {
            const entity = action.payload;
            state.entities.byID[entity.id] = entity as Draft<EntityType<A>>;
            state.entities.allIDs.push(entity.id);
          }
        );
      }

      builder.addCase(asyncActions.update.fulfilled, (state, action) => {
        const entity = action.payload;
        state.entities.byID[entity.id] = entity as Draft<EntityType<A>>;
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
          return emptyEntityState<EntityType<A>>();
        });

        builder.addCase<string, PayloadAction<Entity>>(
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
          builder.addCase<string, PayloadAction<EntityState<Entity>>>(
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

          builder.addCase<string, PayloadAction<EntityStateData<Entity>>>(
            `${hasManyType}/clear`,
            (state, action) => {
              for (let id of state.entities.allIDs) {
                state.entities.byID[id].relationships[foreignKey] = [];
              }
            }
          );

          builder.addCase<string, PayloadAction<Entity>>(
            `${hasManyType}/add/fulfilled`,
            (state, action) => {
              const owneeEntity = action.payload;
              const ownerID = owneeEntity.relationships[backPopKey] as string;
              const ownerEntity = state.entities.byID[ownerID];
              const keys = ownerEntity.relationships[foreignKey] as string[];
              keys.push(owneeEntity.id);
            }
          );

          builder.addCase<string, PayloadAction<Entity>>(
            `${hasManyType}/delete/fulfilled`,
            (state, action) => {
              const owneeEntity = action.payload;
              const ownerID = owneeEntity.relationships[backPopKey] as string;
              const ownerEntity = state.entities.byID[ownerID];
              const owneeIDs = ownerEntity.relationships[
                foreignKey
              ] as string[];
              ownerEntity.relationships[foreignKey] = owneeIDs.filter(
                (id) => id !== owneeEntity.id
              );
            }
          );
        }
      }

      builder
        .addMatcher(isPending, (state) => {
          state.status = "pending";
        })
        .addMatcher(isRejected, (state, action) => {
          state.status = "rejected";
          state.error = action.error.message;
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

export const createAsyncEntityActions = <A, T extends string>(
  entityType: T,
  attributesGetter: EntityAttributesGetter<A>,
  relationships: EntityRelationships
) => {
  const belongsTo = relationships.belongsTo;

  return {
    fetch: createAsyncThunk(
      `${entityType}/fetch`,
      async () =>
        await fetchEntities<T, A>(entityType, attributesGetter, relationships)
    ),
    fetchBelongingTo:
      belongsTo !== undefined
        ? createAsyncThunk(
            `${entityType}/fetchBelongingTo`,
            async (belongsToID: string) =>
              await fetchEntitiesBelongingTo<T, A>(
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
              await createEntityBelongingTo<T, A>(
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
      async (entity: EntityType<A>) =>
        await updateEntity(entityType, attributesGetter, relationships, entity)
    ),
    delete: createAsyncThunk(
      `${entityType}/delete`,
      async (entity: EntityType<A>) => await deleteEntity(entityType, entity)
    ),
  };
};
