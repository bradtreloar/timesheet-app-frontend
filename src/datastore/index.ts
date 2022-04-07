import { client } from "datastore/clients";

export class UnknownError extends Error {
  constructor() {
    super("Unknown error has occurred");
  }
}

export const getCSRFCookie = () => client.get("/csrf-cookie");
