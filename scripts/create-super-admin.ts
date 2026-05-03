/**
 * Usage: npm run create:super-admin
 * Creates a platform-level Super Admin user (not bound to any organization).
 */
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || "superadmin@platform.com";
  const password = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!";

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    console.log(`✅ Super Admin already exists: ${email}`);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: "super_admin",
      organizationId: null, // Super Admin belongs to no org
    },
  });

  console.log("✅ Super Admin created:");
  console.log(`   Email:    ${user.email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role:     ${user.role}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
