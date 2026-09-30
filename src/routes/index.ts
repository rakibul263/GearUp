import { Router } from "express";
import authRoutes from "../modules/auth/auth.route.js";
import categoryRoutes from "../modules/category/category.route.js";
import gearRoutes from "../modules/gear/gear.route.js";
import rentalRoutes from "../modules/rental/rental.route.js";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/gears", gearRoutes);
router.use("/rentals", rentalRoutes);

export default router;
