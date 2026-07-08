import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL Database connected successfully.");
  } catch (error) {
    console.error("❌ Failed to connect to PostgreSQL:", error);
    process.exit(1);
  }
}
