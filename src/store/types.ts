import { PayloadAction, SerializedError } from "@reduxjs/toolkit";

export type StoreStatus = "idle" | "pending" | "fulfilled" | "rejected";

export interface Timestamps {
  created: string;
  changed: string;
}

export type EntityAttributes = Record<string, any>;

export type EntityKeys = Record<string, string | string[]>;

export interface EntityBase extends Timestamps {
  id: string;
  attributes: EntityAttributes;
  relationships: EntityKeys;
}

export interface Entity<A extends EntityAttributes, K extends EntityKeys>
  extends EntityBase {
  attributes: A;
  relationships: K;
}

export interface EntityRelationship {
  type: string;
  foreignKey: string;
  backPopulates: string;
}

export interface EntityRelationships {
  belongsTo?: EntityRelationship;
  hasMany?: EntityRelationship[];
}

export interface OwneeEntityRelationships extends EntityRelationships {
  belongsTo: EntityRelationship;
}

export interface OwnerEntityRelationships extends EntityRelationships {
  hasMany: EntityRelationship[];
}

export interface OwnerOwneeEntityRelationships extends EntityRelationships {
  belongsTo: EntityRelationship;
  hasMany: EntityRelationship[];
}

export type EntityAttributesGetter<A> = (attributes: any) => A;

export interface EntitiesByID<T> {
  [key: string]: T;
}

export interface EntityStateData<T> {
  byID: EntitiesByID<T>;
  allIDs: string[];
}

export interface EntityState<T> {
  entities: EntityStateData<T>;
  status: StoreStatus;
  error: SerializedError | null;
}

export type RejectedAction = PayloadAction<
  unknown,
  string,
  {
    arg: unknown;
    requestId: string;
    rejectedWithValue: boolean;
    requestStatus: "rejected";
    aborted: boolean;
    condition: boolean;
  },
  SerializedError
>;
