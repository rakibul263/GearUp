import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { rentalController } from "./rental.controller.js";
import { createRentalSchema } from "./rental.validation.js";

const router: Router = Router();

router.use(authMiddleware, requireRoles("CUSTOMER"));

router.post("/", validate(createRentalSchema), rentalController.createRental);

router.get("/", rentalController.getMyRentals);

router.get("/:id", rentalController.getRentalById);

router.patch("/:id/cancel", rentalController.cancelRental);

export default router;
