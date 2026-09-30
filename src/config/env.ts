import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
  SALT_ROUNDS: Number(process.env.SALT_ROUNDS) || 10,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",

  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
};
