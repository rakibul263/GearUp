import { Router } from "express";
import adminRoutes from "../modules/admin/admin.route.js";
import authRoutes from "../modules/auth/auth.route.js";
import categoryRoutes from "../modules/category/category.route.js";
import gearRoutes from "../modules/gear/gear.route.js";
import paymentRoutes from "../modules/payment/payment.route.js";
import providerRentalRoutes from "../modules/rental/provider-rental.route.js";
import rentalRoutes from "../modules/rental/rental.route.js";
import reviewRoutes from "../modules/review/review.route.js";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/gears", gearRoutes);
router.use("/gear", gearRoutes);
router.use("/rentals", rentalRoutes);
router.use("/provider/rentals", providerRentalRoutes);
router.use("/payments", paymentRoutes);
router.use("/reviews", reviewRoutes);
router.use("/admin", adminRoutes);

export default router;
