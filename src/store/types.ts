export type StoreStatus = "idle" | "pending" | "fulfilled" | "rejected";

export interface Timestamps {
  created: string;
  changed: string;
}

export type EntityKeys = Record<string, string | string[]>;

export interface Entity extends Timestamps {
  id: string;
  relationships: EntityKeys;
}

export type EntityAttributesGetter<A> = (attributes: any) => A;

export interface EntityType<A> extends Entity {
  attributes: A;
}

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
  error?: string;
}
