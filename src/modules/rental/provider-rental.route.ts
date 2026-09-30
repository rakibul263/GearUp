import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { rentalController } from "./rental.controller.js";
import { updateRentalStatusSchema } from "./rental.validation.js";

const router: Router = Router();

router.use(authMiddleware, requireRoles("PROVIDER"));

router.get("/", rentalController.getProviderRentals);

router.patch(
  "/:id/status",
  validate(updateRentalStatusSchema),
  rentalController.updateProviderRentalStatus,
);

export default router;
