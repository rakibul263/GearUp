import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getRentalDays } from "../../src/utils/date.js";

describe("Date Utility - getRentalDays", () => {
  it("calculates 1 day for same day / 24-hour difference", () => {
    const start = new Date("2026-10-01T10:00:00Z");
    const end = new Date("2026-10-02T10:00:00Z");
    const days = getRentalDays(start, end);
    assert.equal(days, 1);
  });

  it("calculates multi-day rentals correctly", () => {
    const start = new Date("2026-10-01T10:00:00Z");
    const end = new Date("2026-10-06T10:00:00Z");
    const days = getRentalDays(start, end);
    assert.equal(days, 5);
  });

  it("rounds up partial days with Math.ceil", () => {
    const start = new Date("2026-10-01T10:00:00Z");
    const end = new Date("2026-10-02T14:00:00Z"); // 28 hours = 2 days
    const days = getRentalDays(start, end);
    assert.equal(days, 2);
  });
});
