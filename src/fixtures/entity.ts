import faker from "faker";
import Randomstring from "randomstring";
import { defaults } from "lodash";
import { EntityRelationship, EntityRelationships } from "store/entity";
import { EntityKeys } from "store/types";
import { randomID } from "./random";

export interface MockEntityAttributes {
  title: string;
}

export const mockEntityRelationships = (): EntityRelationships => {
  return {
    belongsTo: {
      type: Randomstring.generate(),
      foreignKey: Randomstring.generate(),
      backPopulates: Randomstring.generate(),
    },
    hasMany: [
      {
        type: Randomstring.generate(),
        foreignKey: Randomstring.generate(),
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
    randomEntity: (attributes?: MockEntityAttributes, keys?: EntityKeys) => ({
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
