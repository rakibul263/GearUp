import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/role.middleware.js";
import {
  createGearSchema,
  gearListQuerySchema,
  updateGearSchema,
} from "./gear.validation.js";
import { validate, validateQuery } from "../../middlewares/validation.middleware.js";
import { gearController } from "./gear.controller.js";

const router: Router = Router();

// Public
router.get("/", validateQuery(gearListQuerySchema), gearController.getGears);

router.get("/:id", gearController.getGearById);

// Provider
router.post(
  "/",
  authMiddleware,
  requireRoles("PROVIDER"),
  validate(createGearSchema),
  gearController.createGear,
);

router.patch(
  "/:id",
  authMiddleware,
  requireRoles("PROVIDER"),
  validate(updateGearSchema),
  gearController.updateGear,
);

router.delete(
  "/:id",
  authMiddleware,
  requireRoles("PROVIDER"),
  gearController.deleteGear,
);

export default router;
