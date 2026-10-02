import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, type TestClient } from "../helpers/test-server.js";

describe("Performance & Concurrency: Burst Traffic Stress", () => {
  let client: TestClient;

  before(async () => {
    client = await startTestServer();
  });

  after(async () => {
    await client.close();
  });

  it("handles 50 concurrent requests without server crash or unhandled promise rejection", async () => {
    const burstSize = 50;

    const promises = Array.from({ length: burstSize }, (_, i) =>
      client.get(`/health?burst=${i}`),
    );

    const responses = await Promise.all(promises);

    assert.equal(responses.length, burstSize);
    for (const res of responses) {
      assert.equal(res.status, 200);
      assert.ok(res.headers.get("x-request-id"));
    }
  });

  it("maintains distinct correlation IDs across concurrent requests", async () => {
    const burstSize = 20;

    const promises = Array.from({ length: burstSize }, () =>
      client.get("/health"),
    );

    const responses = await Promise.all(promises);
    const requestIds = new Set(
      responses.map((r) => r.headers.get("x-request-id")),
    );

    assert.equal(requestIds.size, burstSize);
  });
});
