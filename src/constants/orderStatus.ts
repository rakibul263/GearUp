import type { RentalOrderStatus } from "../../generated/prisma/enums.js";

export const ORDER_STATUS = {
  PLACED: "PLACED",
  CONFIRMED: "CONFIRMED",
  PAID: "PAID",
  PICKED_UP: "PICKED_UP",
  RETURNED: "RETURNED",
  CANCELED: "CANCELED",
} as const satisfies Record<RentalOrderStatus, RentalOrderStatus>;
