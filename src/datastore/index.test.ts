import { client } from "datastore/clients";
import MockAdapter from "axios-mock-adapter";
import { getCSRFCookie } from "datastore";

const mockClient = new MockAdapter(client);

beforeEach(() => {
  mockClient.onGet("/csrf-cookie").reply(204);
});

afterEach(() => {
  jest.resetAllMocks();
  mockClient.reset();
});

describe("getCSRFCookie", () => {
  test("requests CSRF token", async () => {
    mockClient.onPost("/csrf-cookie").reply(204);

    await getCSRFCookie();

    const history = mockClient.history;
    expect(history.get.length).toBe(1);
    expect(history.get[0].url).toBe("/csrf-cookie");
  });
});
