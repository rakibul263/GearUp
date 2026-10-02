import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  adminController,
  handleDeleteGearAsAdmin,
  handleGetAllGear,
  handleGetAllRentals,
  handleGetAllUsers,
  handleUpdateUserStatus,
} from "./admin.controller.js";
import { updateUserStatusSchema } from "./admin.validation.js";

const router: Router = Router();

router.use(authMiddleware, requireRoles("ADMIN"));

// User management
router.get("/users", handleGetAllUsers);
router.patch(
  "/users/:id/status",
  validate(updateUserStatusSchema),
  handleUpdateUserStatus,
);

// Gear management
router.get("/gear", handleGetAllGear);
router.delete("/gear/:id", handleDeleteGearAsAdmin);

// Rental management
router.get("/rentals", handleGetAllRentals);

// Refund reconciliation
router.post("/refunds/reconcile", adminController.reconcileRefunds);

export default router;
