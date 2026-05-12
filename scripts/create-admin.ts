/**
 * scripts/create-admin.ts
 *
 * Creates an admin User in the database for testing.
 * Run with:
 *   tsx --env-file=.env.local scripts/create-admin.ts
 *
 * Optionally override defaults via environment variables:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret tsx --env-file=.env.local scripts/create-admin.ts
 */

import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@crestcare.com";
  const plainPassword = process.env.ADMIN_PASSWORD || "Admin@123";

  // ── Resolve default organization ──────────────────────────────────────────
  let org = await prisma.organization.findFirst({
    where: { name: "Crest Care Hospital" },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: { name: "Crest Care Hospital" },
    });
    console.log(`✅ Created organization: ${org.name} (${org.id})`);
  } else {
    console.log(`ℹ️  Using existing organization: ${org.name} (${org.id})`);
  }

  // ── Check if admin already exists ─────────────────────────────────────────
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`⚠️  User with email "${email}" already exists. Skipping.`);
    console.log(`   ID   : ${existing.id}`);
    console.log(`   Role : ${existing.role}`);
    return;
  }

  // ── Hash password (bcrypt, cost factor 12) ────────────────────────────────
  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  // ── Create admin user ─────────────────────────────────────────────────────
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: "admin",
      organizationId: org.id,
    },
  });

  console.log("\n✅ Admin user created successfully:");
  console.log(`   ID             : ${user.id}`);
  console.log(`   Email          : ${user.email}`);
  console.log(`   Role           : ${user.role}`);
  console.log(`   Organization   : ${org.name} (${org.id})`);
  console.log(`   Password       : [hashed — not displayed]`);
  console.log("\n🔐 Login at /login with the email and password you provided.");
}

main()
  .catch((err) => {
    console.error("❌ Script failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
