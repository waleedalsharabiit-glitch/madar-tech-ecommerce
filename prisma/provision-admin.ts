import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const { DATABASE_URL, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = process.env;
if (!DATABASE_URL || !ADMIN_EMAIL || !ADMIN_NAME || !ADMIN_PASSWORD) {
  throw new Error("Set DATABASE_URL, ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD in the environment before provisioning.");
}
if (ADMIN_PASSWORD.length < 16) throw new Error("ADMIN_PASSWORD must be at least 16 characters.");
const config = { databaseUrl: DATABASE_URL, email: ADMIN_EMAIL, name: ADMIN_NAME, password: ADMIN_PASSWORD };

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: config.databaseUrl }) });

async function main() {
  const email = config.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "STORE_ADMIN") throw new Error("This email already belongs to a non-admin user. Provision an unused email instead.");
    console.log("This email is already a store administrator; no changes were made.");
    return;
  }
  await prisma.user.create({
    data: { email, name: config.name.trim(), passwordHash: await hashPassword(config.password), role: "STORE_ADMIN", isActive: true },
  });
  console.log(`Store administrator provisioned: ${email}`);
}

main().catch((error) => { console.error("Admin provisioning failed:", error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
