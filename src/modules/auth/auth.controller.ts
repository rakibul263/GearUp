import { authService } from "./auth.service"
import { Request, Response } from "express";

const register = async (req: Request, res: Response) => {
    const user = await authService.register(req.body);

    res.status(201).json({
        success: true,
        message: "User registered successfully.",
        data: user,
    })
}

export const authController = {
    register
}