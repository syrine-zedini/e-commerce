import fs from "fs";
import path from "path";

// Minimal .env parser (no `dotenv` dependency in this project). Shared by
// server/index.ts (app boot) and drizzle.config.ts (CLI), so DATABASE_URL
// from .env.local resolves the same way in both.
export function loadEnvFile(fileName: string) {
  try {
    const envPath = path.resolve(process.cwd(), fileName);
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, "utf-8");
      envConfig.split("\n").forEach((line) => {
        const parts = line.split("=");
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
          if (key && !key.startsWith("#")) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (err) {
    console.warn(`Failed to load ${fileName} file:`, err);
  }
}

export function loadDotEnvFiles() {
  loadEnvFile(".env");
  // .env.local is gitignored and only ever present on a dev machine — it
  // never ships to production, so this is a no-op there.
  loadEnvFile(".env.local");
}
