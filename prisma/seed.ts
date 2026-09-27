import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/gearup",
});
const prisma = new PrismaClient({ adapter });

const main = async () => {
  const adminPassword = await bcrypt.hash("Admin123456", 12);

  await prisma.user.upsert({
    where: {
      email: "admin@gearup.com",
    },
    update: {
      role: "ADMIN",
      status: "ACTIVE",
    },
    create: {
      name: "GearUp Admin",
      email: "admin@gearup.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const categories = [
    {
      name: "Camping",
      slug: "camping",
      description: "Camping tents, sleeping bags and outdoor equipment",
    },
    {
      name: "Hiking",
      slug: "hiking",
      description: "Gear for hiking and trekking",
    },
    {
      name: "Cycling",
      slug: "cycling",
      description: "Bicycles and cycling equipment",
    },
    {
      name: "Water Sports",
      slug: "water-sports",
      description: "Equipment for water-based outdoor activities",
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
        description: category.description,
      },
      create: category,
    });
  }

  console.log("GearUp seed completed successfully");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
