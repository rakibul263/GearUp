import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPagination } from "../../src/utils/pagination.js";

describe("Pagination Utility", () => {
  it("defaults to page 1 and limit 10 when empty", () => {
    const { page, limit, skip } = getPagination({});
    assert.equal(page, 1);
    assert.equal(limit, 10);
    assert.equal(skip, 0);
  });

  it("parses numeric string parameters correctly", () => {
    const { page, limit, skip } = getPagination({ page: "3", limit: "15" });
    assert.equal(page, 3);
    assert.equal(limit, 15);
    assert.equal(skip, 30);
  });

  it("clamps invalid negative or zero page and enforces limit bounds", () => {
    const minPage = getPagination({ page: "-5", limit: "0" });
    assert.equal(minPage.page, 1);
    assert.equal(minPage.limit, 10); // 0 falsy falls back to 10
    assert.equal(minPage.skip, 0);

    const maxLimit = getPagination({ page: "1", limit: "500" });
    assert.equal(maxLimit.limit, 100);
  });
});
