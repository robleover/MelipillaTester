import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@melipillatester.cl";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "Admin";

  const hashedPassword = await hash(adminPassword, 12);

  // Create team first
  const team = await prisma.team.upsert({
    where: { id: "default-team" },
    update: {},
    create: {
      id: "default-team",
      name: "Melipilla Testers",
      description: "Team de preparación para torneos de Mitos y Leyendas",
    },
  });

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      role: "ADMIN",
      teamId: team.id,
    },
  });

  // Create default active season
  const season = await prisma.season.upsert({
    where: { id: "default-season" },
    update: {},
    create: {
      id: "default-season",
      name: "Nacional 2026",
      teamId: team.id,
      status: "ACTIVE",
    },
  });

  console.log("✅ Seed completed:");
  console.log(`   Team: ${team.name}`);
  console.log(`   Admin: ${admin.email}`);
  console.log(`   Season: ${season.name}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
