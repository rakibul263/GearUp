import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../errors/AppError.js";

export const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        throw new AppError(
          "A record with the same unique value already exists",
          409,
        );

      case "P2025":
        throw new AppError(
          "Requested record was not found",
          404,
        );

      case "P2003":
        throw new AppError(
          "This record cannot be changed because related records exist",
          409,
        );

      case "P2034":
        throw new AppError(
          "Transaction conflict. Please try again",
          409,
        );

      default:
        throw new AppError(
          "Database operation failed",
          500,
        );
    }
  }

  throw error;
};

