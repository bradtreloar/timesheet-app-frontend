import faker from "faker";
import Randomstring from "randomstring";
import { defaults } from "lodash";
import {
  Entity,
  EntityAttributes,
  EntityKeys,
  EntityRelationship,
  EntityRelationships,
} from "store/types";
import { randomID } from "./random";

export interface MockEntityAttributes extends EntityAttributes {
  title: string;
}

export interface MockEntityKeys extends EntityKeys {
  mockParentEntity: string;
}

export type MockEntity = Entity<MockEntityAttributes, {}>;

export const mockEntityRelationships = (): EntityRelationships => {
  return {
    belongsTo: {
      type: "mockParentEntities",
      foreignKey: "mockParentEntity",
      backPopulates: Randomstring.generate(),
    },
    hasMany: [
      {
        type: "mockChildEntities",
        foreignKey: "mockChildEntities",
        backPopulates: Randomstring.generate(),
      },
    ],
  };
};

export const mockEntityType = () => {
  const getAttributes = ({ title }: any): MockEntityAttributes => ({
    title,
  });
  type Attributes = ReturnType<typeof getAttributes>;
  const relationships = mockEntityRelationships();
  const { hasMany } = relationships;

  return {
    type: Randomstring.generate(),
    getAttributes,
    relationships,
    randomEntity: (
      attributes?: MockEntityAttributes,
      keys?: MockEntityKeys
    ) => ({
      id: faker.random.uuid(),
      created: "",
      changed: "",
      attributes: defaults(attributes, {
        title: faker.random.words(3),
      }),
      relationships:
        keys ||
        (hasMany as EntityRelationship[]).reduce(
          (keys, { foreignKey }) => {
            keys[foreignKey] = [];
            return keys;
          },
          {
            [(relationships.belongsTo as EntityRelationship)
              .foreignKey]: randomID(),
          } as EntityKeys
        ),
    }),
  };
};
