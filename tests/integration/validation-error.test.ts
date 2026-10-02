import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, type TestClient } from "../helpers/test-server.js";

describe("Integration: Request Validation & Error Formatting", () => {
  let client: TestClient;

  before(async () => {
    client = await startTestServer();
  });

  after(async () => {
    await client.close();
  });

  it("returns 400 Bad Request when POST /api/auth/register receives missing fields", async () => {
    const res = await client.post("/api/auth/register", {
      name: "A",
      // missing email, password, phone
    });

    assert.equal(res.status, 400);
    const json = (await res.json()) as { success: boolean; message: string };
    assert.equal(json.success, false);
    assert.ok(typeof json.message === "string" && json.message.length > 0);
  });

  it("returns 400 Bad Request when POST /api/auth/login receives invalid email", async () => {
    const res = await client.post("/api/auth/login", {
      email: "invalid-email-format",
      password: "",
    });

    assert.equal(res.status, 400);
    const json = (await res.json()) as { success: boolean; message: string };
    assert.equal(json.success, false);
    assert.ok(json.message.includes("email"));
  });

  it("returns 401 Unauthorized when accessing protected route without token", async () => {
    const res = await client.get("/api/auth/me");
    assert.equal(res.status, 401);
    const json = (await res.json()) as { success: boolean; message: string };
    assert.equal(json.success, false);
    assert.equal(json.message, "Authentication required");
  });
});
