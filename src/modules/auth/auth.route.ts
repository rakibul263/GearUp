import { Router } from "express";
import { loginSchema, registerSchema } from "./auth.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { authController } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

import { authLimiter } from "../../middlewares/rateLimit.middleware.js";

const router: Router = Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register,
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  authController.login,
);

router.get("/me", authMiddleware, authController.me);

export default router;