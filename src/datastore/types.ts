import { Timestamps } from "store/types";
import { UserAttributes } from "users/types";

export interface UserResource {
  id: string;
  type: "users";
  attributes: Timestamps & UserAttributes;
}

export interface RelatedResource {
  id: string;
  type: string;
}

export interface EntityRelatedResources {
  [key: string]: {
    data: RelatedResource | RelatedResource[];
  };
}

export interface EntityResource<
  T extends string,
  A extends Record<string, any>
> {
  id: string;
  type: T;
  attributes: Timestamps & A;
  relationships: EntityRelatedResources;
}

export interface NewEntityResource<T, Attributes> {
  type: T;
  attributes: Attributes;
}

export interface RelatedEntityResource<T> {
  data: {
    id: string;
    type: T;
  };
}

export interface Filters {
  changedAfter?: string;
}
