import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, type TestClient } from "../helpers/test-server.js";

describe("Integration: Security Headers & Correlation ID", () => {
  let client: TestClient;

  before(async () => {
    client = await startTestServer();
  });

  after(async () => {
    await client.close();
  });

  it("sets standard OWASP security headers on responses", async () => {
    const res = await client.get("/health");

    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.equal(res.headers.get("x-frame-options"), "DENY");
    assert.equal(res.headers.get("x-xss-protection"), "0");
    assert.equal(
      res.headers.get("referrer-policy"),
      "strict-origin-when-cross-origin",
    );
    assert.equal(res.headers.get("x-powered-by"), null);
  });

  it("generates a new X-Request-Id when client does not supply one", async () => {
    const res = await client.get("/health");
    const reqId = res.headers.get("x-request-id");

    assert.ok(reqId && reqId.length > 0);
  });

  it("preserves incoming X-Request-Id correlation header", async () => {
    const customId = "trace-client-order-98765";
    const res = await client.get("/health", {
      "x-request-id": customId,
    });

    assert.equal(res.headers.get("x-request-id"), customId);
  });

  it("includes rate limit headers on /api requests", async () => {
    const res = await client.get("/api/unknown");

    assert.ok(res.headers.get("ratelimit-limit"));
    assert.ok(res.headers.get("ratelimit-remaining"));
    assert.ok(res.headers.get("ratelimit-reset"));
  });
});
