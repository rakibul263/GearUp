import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { categoryController } from "./category.controller.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "./category.validation.js";

const router: Router = Router();

// Public routes
router.get("/", categoryController.getCategories);

router.get("/:id", categoryController.getCategoryById);

// Admin routes
router.post(
  "/",
  authMiddleware,
  requireRoles("ADMIN"),
  validate(createCategorySchema),
  categoryController.createCategory,
);

router.patch(
  "/:id",
  authMiddleware,
  requireRoles("ADMIN"),
  validate(updateCategorySchema),
  categoryController.updateCategory,
);

router.delete(
  "/:id",
  authMiddleware,
  requireRoles("ADMIN"),
  categoryController.deleteCategory,
);

export default router;
