import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, type TestClient } from "../helpers/test-server.js";

describe("Integration: 404 Not Found Middleware", () => {
  let client: TestClient;

  before(async () => {
    client = await startTestServer();
  });

  after(async () => {
    await client.close();
  });

  it("returns 404 with structured JSON for nonexistent route", async () => {
    const res = await client.get("/api/unknown-endpoint-12345");
    assert.equal(res.status, 404);
    const json = await res.json() as { success: boolean; message: string };
    assert.equal(json.success, false);
    assert.ok(json.message.includes("Route not found"));
  });
});
