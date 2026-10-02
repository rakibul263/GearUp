import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, type TestClient } from "../helpers/test-server.js";

describe("Integration: Health & Root Endpoints", () => {
  let client: TestClient;

  before(async () => {
    client = await startTestServer();
  });

  after(async () => {
    await client.close();
  });

  it("GET / returns 200 with service welcome string", async () => {
    const res = await client.get("/");
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.equal(text, "GearUp API is running");
  });

  it("GET /health returns 200 with JSON health status", async () => {
    const res = await client.get("/health");
    assert.equal(res.status, 200);
    const json = await res.json() as { success: boolean; message: string };
    assert.equal(json.success, true);
    assert.equal(json.message, "GearUp API is running");
  });
});
