import express, { Router } from "express";

import { paymentController } from "./payment.controller.js";

const router: Router = Router();

router.post(
  "/",
  express.raw({
    type: "application/json",
  }),
  paymentController.stripeWebhook,
);

export default router;
