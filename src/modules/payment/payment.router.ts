import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/role.middleware.js";
import { paymentController } from "./payment.controller.js";
import { createPaymentSchema } from "./payment.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";

const router: Router = Router();

router.use(authMiddleware, requireRoles("CUSTOMER"));

router.post(
  "/",
  validate(createPaymentSchema),
  paymentController.createPayment,
);

router.get("/", paymentController.getMyPayments);

router.get("/:id", paymentController.getPaymentById);

export default router;
