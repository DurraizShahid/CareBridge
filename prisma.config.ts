import { config } from "dotenv";
// Prefer local development settings; explicitly exported environment variables still win.
config({ path: ".env.local" });
config({ path: ".env" });
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
