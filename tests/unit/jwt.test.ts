import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateAccessToken, verifyAccessToken } from "../../src/utils/jwt.js";

describe("JWT Utility", () => {
  it("generates a signed token and decodes correct claims", () => {
    const payload = {
      userId: "usr_test_123",
      role: "CUSTOMER" as const,
    };

    const token = generateAccessToken(payload);
    assert.ok(typeof token === "string" && token.split(".").length === 3);

    const decoded = verifyAccessToken(token);
    assert.equal(decoded.userId, payload.userId);
    assert.equal(decoded.role, payload.role);
    assert.ok(typeof decoded.exp === "number");
  });

  it("throws an error when verifying a tampered token", () => {
    const payload = {
      userId: "usr_test_456",
      role: "PROVIDER" as const,
    };

    const token = generateAccessToken(payload);
    const tampered = token.slice(0, -5) + "abcde";

    assert.throws(() => {
      verifyAccessToken(tampered);
    });
  });
});
