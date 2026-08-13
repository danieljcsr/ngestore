import "dotenv/config";
import type { PrismaConfig } from "prisma";

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
} satisfies PrismaConfig;
