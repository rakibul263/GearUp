import { Router } from "express";
import { loginSchema, registerSchema } from "./auth.validation.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { authController } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router: Router = Router();

router.post("/register", validate(registerSchema), authController.register)

router.post("/login", validate(loginSchema), authController.login)

router.get("/me", authMiddleware, authController.me)

export default router;