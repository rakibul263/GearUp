import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, type TestClient } from "../helpers/test-server.js";

describe("Integration: Swagger & OpenAPI Documentation", () => {
  let client: TestClient;

  before(async () => {
    client = await startTestServer();
  });

  after(async () => {
    await client.close();
  });

  it("GET /api/docs/openapi.json returns 200 with valid OpenAPI 3.0 spec", async () => {
    const res = await client.get("/api/docs/openapi.json");
    assert.equal(res.status, 200);
    const json = (await res.json()) as { openapi: string; info: { title: string } };
    assert.equal(json.openapi, "3.0.3");
    assert.equal(json.info.title, "GearUp API");
  });

  it("GET /docs returns 200 HTML with Swagger UI script bundle", async () => {
    const res = await client.get("/docs");
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("swagger-ui"));
    assert.ok(html.includes("GearUp API Documentation"));
  });
});
