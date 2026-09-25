import { Router } from "express";
import { loginSchema, registerSchema } from "./auth.validation";
import { validate } from "../../middlewares/validation.middleware";
import { authController } from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router: Router = Router();

router.post("/register", validate(registerSchema), authController.register)

router.post("/login", validate(loginSchema), authController.login)

router.get("/me", authMiddleware, authController.me)

export default router;