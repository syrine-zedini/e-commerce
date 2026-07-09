import { defineConfig } from "drizzle-kit";
import { loadDotEnvFiles } from "./server/loadEnv";

loadDotEnvFiles();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — add it to .env.local");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
