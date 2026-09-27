import { UserRole } from "../../generated/prisma/enums.js";

export const USER_ROLES = {
  CUSTOMER: "CUSTOMER",
  PROVIDER: "PROVIDER",
  ADMIN: "ADMIN",
} as const satisfies Record<UserRole, UserRole>;
