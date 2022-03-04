import { mockEntityType } from "fixtures/entity";
import { randomID } from "fixtures/random";
import Randomstring from "randomstring";
import { EntityRelationship, EntityRelationships } from "store/entity";
import { EntityType } from "store/types";
import {
  makeEntityResource,
  makeNewEntityResource,
  makeRelatedEntityResources,
  parseEntity,
  parseRelatedEntities,
} from "./adapters";

describe("parseEntity", () => {
  test("converts EntityResource to Entity", () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const belongsTo = relationships.belongsTo as EntityRelationship;
    const hasMany = (relationships.hasMany as EntityRelationship[])[0];
    const belongsToID = randomID();
    const hasManyID = randomID();
    const entity = randomEntity();
    entity.relationships[belongsTo.foreignKey] = belongsToID;
    entity.relationships[hasMany.foreignKey] = [hasManyID];
    const { id, changed, created, attributes } = entity;

    const resource = {
      type,
      id,
      attributes: {
        created,
        changed,
        ...attributes,
      },
      relationships: {
        [belongsTo.foreignKey]: {
          data: {
            id: belongsToID,
            type: belongsTo.type,
          },
        },
        [hasMany.foreignKey]: {
          data: [
            {
              id: hasManyID,
              type: hasMany.type,
            },
          ],
        },
      },
    };

    const result = parseEntity(type, getAttributes, relationships, resource);

    expect(result).toStrictEqual(entity);
  });
});

describe("parseRelatedEntities", () => {
  test("parses foreign keys from relationships", () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const belongsTo = relationships.belongsTo as EntityRelationship;
    const hasMany = (relationships.hasMany as EntityRelationship[])[0];
    const belongsToID = randomID();
    const hasManyID = randomID();

    const resource = {
      id: randomID(),
      type,
      attributes: {
        created: "",
        changed: "",
      },
      relationships: {
        [belongsTo.foreignKey]: {
          data: {
            id: belongsToID,
            type: belongsTo.type,
          },
        },
        [hasMany.foreignKey]: {
          data: [
            {
              id: hasManyID,
              type: hasMany.type,
            },
          ],
        },
      },
    };

    const keys = parseRelatedEntities(relationships, resource);

    expect(keys).toStrictEqual({
      [belongsTo.foreignKey]: belongsToID,
      [hasMany.foreignKey]: [hasManyID],
    });
  });
});

describe("makeEntityResource", () => {
  test("converts Entity to EntityResource", () => {
    const {
      type,
      getAttributes,
      relationships,
      randomEntity,
    } = mockEntityType();
    const belongsTo = relationships.belongsTo as EntityRelationship;
    const hasMany = (relationships.hasMany as EntityRelationship[])[0];
    const entity = randomEntity();
    const belongsToID = randomID();
    const hasManyID = randomID();
    entity.relationships[belongsTo.foreignKey] = belongsToID;
    entity.relationships[hasMany.foreignKey] = [hasManyID];

    const result = makeEntityResource(type, relationships, entity);

    expect(result).toStrictEqual({
      type,
      id: entity.id,
      attributes: {
        changed: entity.changed,
        created: entity.created,
        ...entity.attributes,
      },
      relationships: {
        [belongsTo.foreignKey]: {
          data: {
            id: belongsToID,
            type: belongsTo.type,
          },
        },
        [hasMany.foreignKey]: {
          data: [
            {
              id: hasManyID,
              type: hasMany.type,
            },
          ],
        },
      },
    });
  });
});

describe("makeRelatedEntityResources", () => {
  test("builds related entities data from foreign keys", () => {
    const type = Randomstring.generate();
    const belongsToKey = Randomstring.generate();
    const belongsToType = Randomstring.generate();
    const belongsToID = randomID();
    const hasManyKey = Randomstring.generate();
    const hasManyType = Randomstring.generate();
    const hasManyID = randomID();

    const entity = {
      id: Randomstring.generate(),
      created: "",
      changed: "",
      attributes: {},
      relationships: {
        [belongsToKey]: belongsToID,
        [hasManyKey]: [hasManyID],
      },
    };

    const relationships: EntityRelationships = {
      belongsTo: {
        type: belongsToType,
        foreignKey: belongsToKey,
        backPopulates: Randomstring.generate(),
      },
      hasMany: [
        {
          type: hasManyType,
          foreignKey: hasManyKey,
          backPopulates: Randomstring.generate(),
        },
      ],
    };

    const relatedResources = makeRelatedEntityResources(relationships, entity);

    expect(relatedResources).toStrictEqual({
      [belongsToKey]: {
        data: {
          id: belongsToID,
          type: belongsToType,
        },
      },
      [hasManyKey]: {
        data: [
          {
            id: hasManyID,
            type: hasManyType,
          },
        ],
      },
    });
  });
});

describe("makeNewEntityResource", () => {
  test("makes NewEntityResource from attributes, given type", () => {
    const { type, randomEntity } = mockEntityType();
    const { attributes } = randomEntity();

    const result = makeNewEntityResource(type, attributes);

    expect(result).toStrictEqual({
      type,
      attributes,
    });
  });
});
