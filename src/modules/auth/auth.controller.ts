import { authService } from "./auth.service.js"
import { Request, Response } from "express";

const register = async (req: Request, res: Response) => {
    const user = await authService.register(req.body);

    res.status(201).json({
        success: true,
        message: "User registered successfully.",
        data: user,
    })
}

const login = async (req: Request, res: Response) => {
    const result = await authService.login(req.body);

    res.status(200).json({
        success: true, 
        message: "Login Successful.",
        data: result
    })
}

const me = async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user!.userId);

    res.status(200).json({
        success: true,
        message: "User fetched successfully.",
        data: user,
    })
}

export const authController = {
    register,
    login,
    me
}