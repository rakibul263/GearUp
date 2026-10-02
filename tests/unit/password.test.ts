import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, comparePassword } from "../../src/utils/password.js";

describe("Password Utility", () => {
  it("hashes password and verifies successfully with correct password", async () => {
    const raw = "SecurePass123!";
    const hash = await hashPassword(raw);

    assert.notEqual(hash, raw);
    assert.ok(hash.startsWith("$2"), "Hash should start with bcrypt salt prefix");

    const isValid = await comparePassword(raw, hash);
    assert.equal(isValid, true);
  });

  it("fails verification with incorrect password", async () => {
    const raw = "SecurePass123!";
    const wrong = "WrongPassword999!";
    const hash = await hashPassword(raw);

    const isValid = await comparePassword(wrong, hash);
    assert.equal(isValid, false);
  });
});
