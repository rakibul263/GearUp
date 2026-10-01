import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  handleCreateReview,
  handleGetGearReviews,
} from "./review.controller.js";
import { createReviewSchema } from "./review.validation.js";

const router: Router = Router();

router.post(
  "/",
  authMiddleware,
  requireRoles("CUSTOMER"),
  validate(createReviewSchema),
  handleCreateReview,
);

router.get(
  "/gear/:gearItemId",
  handleGetGearReviews,
);

export default router;
