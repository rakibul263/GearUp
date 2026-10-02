import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../../src/errors/AppError.js";

describe("AppError", () => {
  it("initializes with correct statusCode, message, and fail status for 4xx", () => {
    const error = new AppError("Invalid input", 400);

    assert.equal(error.message, "Invalid input");
    assert.equal(error.statusCode, 400);
    assert.equal(error.status, "fail");
    assert.equal(error.isOperational, true);
    assert.ok(error instanceof Error);
  });

  it("sets error status for 5xx", () => {
    const error = new AppError("Internal crash", 500);

    assert.equal(error.statusCode, 500);
    assert.equal(error.status, "error");
    assert.equal(error.isOperational, true);
  });
});
