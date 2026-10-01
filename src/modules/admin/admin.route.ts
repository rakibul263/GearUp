import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  handleGetAllUsers,
  handleUpdateUserStatus,
} from "./admin.controller.js";
import { updateUserStatusSchema } from "./admin.validation.js";

const router: Router = Router();

router.use(authMiddleware, requireRoles("ADMIN"));

router.get("/users", handleGetAllUsers);

router.patch(
  "/users/:id/status",
  validate(updateUserStatusSchema),
  handleUpdateUserStatus,
);

export default router;
