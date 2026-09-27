import { RequestHandler } from "express";
import { ZodType } from "zod";
import { AppError } from "./AppError.js";


export const validate = (schema: ZodType): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new AppError(message, 400);
    }

    req.body = result.data;

    next();
  };
};
