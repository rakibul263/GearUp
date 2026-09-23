import { Request, Response } from "express";

export const notFoundMiddleware = (req: Request, res: Response) => {
    res.status(404).json({
        status: "fail",
        message: `Can't find ${req.originalUrl} on this server!`,
    });
}