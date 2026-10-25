import { defineConfig } from "drizzle-kit";

// Reads DATABASE_URL from .env.local. Run: pnpm db:generate, then pnpm db:migrate.
process.loadEnvFile?.(".env.local");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
