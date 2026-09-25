import { UserRole } from "../../generated/prisma/enums";

export interface AuthUser {
    userId: string;
    role: UserRole;
}