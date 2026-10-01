import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/role.middleware.js";
import { paymentController } from "./payment.controller.js";
import {
  createPaymentSchema,
  refundPaymentSchema,
} from "./payment.validation.js";
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

router.post(
  "/:id/refund",
  validate(refundPaymentSchema),
  paymentController.refundPayment,
);

export default router;
