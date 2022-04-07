import { client } from "datastore/clients";
import { BaseException } from "utils/exceptions";

export class UnknownError extends BaseException {
  constructor() {
    super("Unknown error has occurred");
  }
}

export const getCSRFCookie = () => client.get("/csrf-cookie");
