import { defineConfig } from "drizzle-kit";
import { configManager } from "@triplecheck/core/config";

// Load configuration
const config = configManager.config;

if (!config.database.url) {
  throw new Error("DATABASE_URL not configured, ensure the database is provisioned");
}

export default defineConfig({
  out: "./server/infrastructure/database/migrations",
  schema: "./server/infrastructure/database/schemas/core/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: config.database.url,
  },
});
