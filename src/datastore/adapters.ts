import { EntityRelationships } from "store/entity";
import { EntityType } from "store/types";
import {
  EntityRelatedResources,
  EntityResource,
  RelatedResource,
} from "./types";

export const parseEntity = <T extends string, A>(
  type: T,
  getAttributes: (a: any) => A,
  relationships: EntityRelationships,
  resource: EntityResource<T, A>
) => {
  const { attributes } = resource;
  const { changed, created } = attributes;

  return {
    id: resource.id,
    created,
    changed,
    attributes: getAttributes(attributes),
    relationships: parseRelatedEntities(relationships, resource),
  };
};

export const parseRelatedEntities = <T extends string, A>(
  relationships: EntityRelationships,
  resource: EntityResource<T, A>
) => {
  const { belongsTo, hasMany } = relationships;
  const keys = {} as Record<string, string | string[]>;
  if (belongsTo !== undefined) {
    const { foreignKey } = belongsTo;
    keys[foreignKey] = (resource.relationships[foreignKey]
      .data as RelatedResource).id;
  }
  if (hasMany !== undefined) {
    for (let { foreignKey } of hasMany) {
      const data = resource.relationships[foreignKey].data as RelatedResource[];
      keys[foreignKey] = data.map(({ id }) => id);
    }
  }
  return keys;
};

export const makeEntityResource = <T extends string, A>(
  type: T,
  relationships: EntityRelationships,
  entity: EntityType<A>
): EntityResource<T, A> => {
  return {
    id: entity.id,
    type: type,
    attributes: {
      created: entity.created,
      changed: entity.changed,
      ...entity.attributes,
    },
    relationships: makeRelatedEntityResources(relationships, entity),
  };
};

export const makeRelatedEntityResources = <A>(
  relationships: EntityRelationships,
  entity: EntityType<A>
) => {
  const { belongsTo, hasMany } = relationships;
  const related = {} as EntityRelatedResources;
  if (belongsTo !== undefined) {
    const { type, foreignKey } = belongsTo;
    related[foreignKey] = {
      data: {
        type,
        id: entity.relationships[foreignKey] as string,
      },
    };
  }
  if (hasMany !== undefined) {
    for (let { type, foreignKey } of hasMany) {
      related[foreignKey] = {
        data: (entity.relationships[foreignKey] as string[]).map((id) => ({
          type,
          id,
        })),
      };
    }
  }
  return related;
};

export const makeNewEntityResource = <T, A>(type: T, entityAttributes: A) => ({
  type,
  attributes: entityAttributes,
});
