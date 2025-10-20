import { defineConfig } from "drizzle-kit";

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: isProduction ? "postgresql" : "sqlite",
  dbCredentials: isProduction ? {
    url: process.env.DATABASE_URL!,
  } : {
    url: "beatbazaar.db",
  },
});
