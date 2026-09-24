import jwt, { JwtPayload, SignOptions } from "jsonwebtoken"
import { env } from "../config/env"

export interface AuthTokenPayload extends JwtPayload {
    userId: string;
    role: "CUSTOMER" | "PROVIDER" | "ADMIN"
}

export const generateAccessToken = (payload: AuthTokenPayload):string => {
    const options: SignOptions = {
        expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    }
    return jwt.sign(payload, env.JWT_SECRET, options);
}

export const verifyAccessToken = (token: string): AuthTokenPayload => {
    return jwt.verify(token,env.JWT_SECRET) as AuthTokenPayload
}