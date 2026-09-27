import { UserRole } from "../../generated/prisma/enums.js";

export interface AuthUser {
    userId: string;
    role: UserRole;
}