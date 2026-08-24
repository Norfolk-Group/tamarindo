import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

export async function seed(): Promise<void> {
  console.log("Seeding Tamarindo…");

  await prisma.profile.upsert({
    where: { authSubject: "dev-local" },
    create: {
      authSubject: "dev-local",
      displayName: "Ricardo (dev)",
      role: "admin",
      org: "Tamarindo",
    },
    update: { displayName: "Ricardo (dev)", role: "admin" },
  });

  const existingTerms = await prisma.dealTerms.findUnique({
    where: { version: 1 },
  });
  if (!existingTerms) {
    await prisma.dealTerms.create({
      data: {
        version: 1,
        status: "draft",
        notes:
          "Placeholder from the thesis. Do not publish until Ricardo's model confirms the numbers.",
        payload: {
          clientRateRange: "10-12%",
          maxLtv: 0.6,
          targetDownPayment: 0.4,
          termYears: 10,
          residualRange: "10-20%",
          activationFeeBps: 200,
          interestShare: 0.2,
          rentalShare: 0.2,
          seedAskUsd: null,
          status: "ASSUMPTION — not for investor use",
        },
      },
    });
  }

  console.log("Seed complete.");
}

if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  seed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
