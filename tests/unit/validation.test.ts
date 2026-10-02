import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { registerSchema, loginSchema } from "../../src/modules/auth/auth.validation.js";
import { createCategorySchema } from "../../src/modules/category/category.validation.js";
import { createGearSchema } from "../../src/modules/gear/gear.validation.js";
import { createRefundSchema } from "../../src/modules/payment/payment.validation.js";

describe("Zod Validation Schemas", () => {
  describe("Auth Validation", () => {
    it("accepts valid registration data and lowercases email", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "TEST@EXAMPLE.COM",
        password: "securePassword123",
        phone: "+8801712345678",
        role: "CUSTOMER",
      });

      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.email, "test@example.com");
      }
    });

    it("rejects invalid email and short password", () => {
      const result = registerSchema.safeParse({
        name: "A",
        email: "invalid-email",
        password: "123",
        phone: "123",
      });

      assert.equal(result.success, false);
    });

    it("validates login credentials correctly", () => {
      const valid = loginSchema.safeParse({
        email: "test@example.com",
        password: "secretPassword",
      });
      assert.equal(valid.success, true);

      const invalid = loginSchema.safeParse({
        email: "not-an-email",
        password: "",
      });
      assert.equal(invalid.success, false);
    });
  });

  describe("Category Validation", () => {
    it("accepts valid slug and name", () => {
      const result = createCategorySchema.safeParse({
        name: "Camping & Hiking",
        slug: "camping-hiking",
        description: "Outdoor equipment",
      });
      assert.equal(result.success, true);
    });

    it("rejects uppercase and invalid characters in slug", () => {
      const result = createCategorySchema.safeParse({
        name: "Camping",
        slug: "Camping_Hiking!",
      });
      assert.equal(result.success, false);
    });
  });

  describe("Gear Validation", () => {
    it("validates valid gear and converts numeric strings", () => {
      const result = createGearSchema.safeParse({
        categoryId: "cat_123",
        name: "Mountain Tent 4P",
        slug: "mountain-tent-4p",
        pricePerDay: "45.50",
        stock: "3",
      });

      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.pricePerDay, 45.5);
        assert.equal(result.data.stock, 3);
        assert.equal(result.data.isAvailable, true);
      }
    });

    it("rejects negative price and zero stock", () => {
      const result = createGearSchema.safeParse({
        categoryId: "cat_123",
        name: "Tent",
        slug: "tent",
        pricePerDay: -10,
        stock: 0,
      });

      assert.equal(result.success, false);
    });
  });

  describe("Payment Refund Validation", () => {
    it("accepts valid refund input with positive amount", () => {
      const result = createRefundSchema.safeParse({
        paymentId: "pay_123",
        amount: "500.00",
        reason: "Cancelled rental refund",
      });

      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.amount, 500);
      }
    });

    it("rejects zero or negative refund amount", () => {
      const result = createRefundSchema.safeParse({
        paymentId: "pay_123",
        amount: 0,
      });

      assert.equal(result.success, false);
    });
  });
});
