import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PROJECTS = [
  { name: "TPF", color: "#3B82F6" },
  { name: "Deeper Dialog", color: "#8B5CF6" },
  { name: "Moltbot", color: "#EC4899" },
  { name: "Home", color: "#F59E0B" },
  { name: "Family", color: "#10B981" },
  { name: "CTS", color: "#EF4444" },
  { name: "R&R", color: "#06B6D4" },
  { name: "Exercise", color: "#84CC16" },
];

async function main() {
  for (const project of DEFAULT_PROJECTS) {
    await prisma.project.upsert({
      where: { name: project.name },
      update: {},
      create: {
        name: project.name,
        color: project.color,
      },
    });
  }
  console.log("Seeded default projects");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
