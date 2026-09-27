import { Router } from "express";
import authRoutes from "../modules/auth/auth.route.js";
import categoryRoutes from "../modules/category/category.route.js";
const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);

export default router;
