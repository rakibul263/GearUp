import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env.js";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const connectDatabase = async () => {
  await prisma.$connect();
  console.log("Database connected");
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  console.log("Database disconnected");
};

export default prisma;
