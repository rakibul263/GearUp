import dotenv from "dotenv";

dotenv.config();

export const env = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || "development",
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/gearup",
    JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
    SALT_ROUNDS: Number(process.env.SALT_ROUNDS) || 10,
}